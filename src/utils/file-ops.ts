import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'yaml';
import { AgentAdapter } from '../adapters';
import { ConfigManager } from './config';
import { detectAgents } from './detect-agent';
import { normalizeInstallType } from './install-type';

let hasWarnedWorkflowDeprecation = false;

async function readSkillMarkdownFromDir(dirPath: string): Promise<string | null> {
    const candidates = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];
    for (const fileName of candidates) {
        const fullPath = path.join(dirPath, fileName);
        if (await fs.pathExists(fullPath)) return await fs.readFile(fullPath, 'utf8');
    }
    return null;
}

function extractFrontmatter(markdown: string): { frontmatter: string | null; body: string; parsed: any } {
    const trimmed = markdown.trim();
    if (!trimmed.startsWith('---')) {
        return { frontmatter: null, body: markdown, parsed: {} };
    }

    const parts = trimmed.split('---');
    if (parts.length >= 3) {
        const frontmatter = parts[1] || ''; // Prevent undefined TS errors
        const body = parts.slice(2).join('---').trim();
        try {
            const parsed = yaml.parse(frontmatter) || {};
            return { frontmatter, body, parsed };
        } catch {
            return { frontmatter, body, parsed: {} };
        }
    }

    return { frontmatter: null, body: markdown, parsed: {} };
}

function toSkillMd(name: string, markdown: string): string {
    const { parsed, body } = extractFrontmatter(markdown);

    if (!parsed.name) {
        parsed.name = name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // De-slugify
    }

    return [
        '---',
        yaml.stringify(parsed).trim(),
        '---',
        '',
        body
    ].join('\n') + '\n';
}

function toCursorRuleMdc(name: string, markdown: string): string {
    const { parsed, body } = extractFrontmatter(markdown);

    if (!parsed.description) {
        const safeName = name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || name;
        parsed.description = `Installed by mountd: ${safeName}`;
    }
    if (!parsed.globs) {
        parsed.globs = ['**/*'];
    }
    if (parsed.alwaysApply === undefined) {
        parsed.alwaysApply = false;
    }

    return [
        '---',
        yaml.stringify(parsed).trim(),
        '---',
        '',
        body
    ].join('\n') + '\n';
}

export async function installLocalSkill(
    sourcePath: string,
    options: { force?: boolean; global?: boolean },
    originalSource?: string,
    agentAdapters?: AgentAdapter[],
    type?: 'skill' | 'workflow',
    cwd: string = process.cwd()
): Promise<boolean> {
    // 1. Validate Source
    if (!await fs.pathExists(sourcePath)) {
        throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const normalizedType = normalizeInstallType(type);
    if (normalizedType.wasDeprecated && !hasWarnedWorkflowDeprecation) {
        hasWarnedWorkflowDeprecation = true;
        console.warn(
            chalk.yellow(
                '`workflow` is deprecated and now installs as `skill`. Please migrate registry items to type "skill".'
            )
        );
    }

    // 2. Detect Agents and Get Target Directories
    const installGlobal = !!options.global;
    const adapters = agentAdapters && agentAdapters.length > 0 ? agentAdapters : await detectAgents(cwd, { global: installGlobal });
    let skillName = path.basename(sourcePath);
    if (skillName.toLowerCase().endsWith('.md')) {
        skillName = skillName.slice(0, -3);
    }

    for (const adapter of adapters) {
        if (installGlobal && !adapter.supportsGlobalInstall) {
            console.warn(chalk.yellow(`${adapter.displayName} does not support --global installs. Skipping.`));
            continue;
        }

        if (!installGlobal && !adapter.supportsLocalInstall) {
            console.warn(chalk.yellow(`${adapter.displayName} does not support local installs. Skipping.`));
            continue;
        }

        const targetDir = installGlobal
            ? adapter.getGlobalSkillPath(cwd, skillName)
            : adapter.getSkillPath(cwd, skillName);

        console.log(chalk.blue(`Target directory (${adapter.displayName}): ${targetDir}`));

        // 3. Check Destination
        if (await fs.pathExists(targetDir) && !options.force) {
            console.warn(chalk.yellow(`Skill '${skillName}' already exists for ${adapter.displayName}. Skipping. Use --force to overwrite.`));
            continue;
        }

        // 4. Copy Files
        try {
            const stats = await fs.stat(sourcePath);
            const targetLooksLikeFile = path.extname(targetDir).toLowerCase() === '.mdc';
            await fs.ensureDir(path.dirname(targetDir)); // Ensure parent dir exists

            // If it's a file (often true for workflows), copy ensuring directory exists
            // If it's a dir (often true for skills), copy recursively
            if (stats.isFile()) {

                // If adapter targets a single file, copy directly (no skill folder semantics).
                if (targetLooksLikeFile) {
                    await fs.ensureDir(path.dirname(targetDir));
                    if (path.extname(targetDir).toLowerCase() === '.mdc') {
                        const md = await fs.readFile(sourcePath, 'utf8');
                        await fs.writeFile(targetDir, toCursorRuleMdc(skillName, md), 'utf8');
                    } else {
                        await fs.copy(sourcePath, targetDir, { overwrite: options.force });
                    }
                } else {
                    // Skill behavior (existing): create folder and place content inside.
                    await fs.ensureDir(targetDir);
                    const md = await fs.readFile(sourcePath, 'utf8');
                    await fs.writeFile(path.join(targetDir, 'SKILL.md'), toSkillMd(skillName, md), 'utf8');
                }

            } else {
                if (targetLooksLikeFile) {
                    const md = await readSkillMarkdownFromDir(sourcePath);
                    if (!md) {
                        console.warn(chalk.yellow(`No SKILL.md found in ${sourcePath}. Skipping ${adapter.displayName}.`));
                        continue;
                    }
                    await fs.ensureDir(path.dirname(targetDir));
                    if (path.extname(targetDir).toLowerCase() === '.mdc') {
                        await fs.writeFile(targetDir, toCursorRuleMdc(skillName, md), 'utf8');
                    } else {
                        await fs.writeFile(targetDir, toSkillMd(skillName, md), 'utf8');
                    }
                } else {
                    await fs.ensureDir(targetDir);
                    await fs.copy(sourcePath, targetDir, { overwrite: options.force });
                }
            }
        } catch (err: any) {
            console.error(chalk.red(`Failed to install ${normalizedType.canonicalType} for ${adapter.displayName}: ${err.message}`));
        }
    }

    // 5. Update Config
    const configManager = new ConfigManager(cwd);
    await configManager.addInstalledSkill({
        name: skillName,
        source: originalSource || sourcePath,
        type: normalizedType.canonicalType,
        legacyType: normalizedType.legacyType,
        installedAt: new Date().toISOString()
    });

    return true;
}
