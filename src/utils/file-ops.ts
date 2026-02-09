import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { detectAgents } from './detect-agent';
import { type AgentType } from '../types';
import { ConfigManager } from './config';
import { AgentAdapter } from '../adapters';

export async function installLocalSkill(
    sourcePath: string,
    options: { force?: boolean },
    originalSource?: string,
    agentAdapters?: AgentAdapter[],
    type?: 'skill' | 'workflow'
): Promise<boolean> {
    // 1. Validate Source
    if (!await fs.pathExists(sourcePath)) {
        throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    // 2. Detect Agents and Get Target Directories
    const adapters = agentAdapters && agentAdapters.length > 0 ? agentAdapters : await detectAgents();
    const skillName = path.basename(sourcePath);

    for (const adapter of adapters) {
        // Use workflow path if type is workflow, otherwise default to skill path
        const targetDir = type === 'workflow'
            ? adapter.getWorkflowPath(process.cwd(), skillName)
            : adapter.getSkillPath(process.cwd(), skillName);

        console.log(chalk.blue(`Target directory (${adapter.displayName}): ${targetDir}`));

        // 3. Check Destination
        if (await fs.pathExists(targetDir) && !options.force) {
            console.warn(chalk.yellow(`${type === 'workflow' ? 'Workflow' : 'Skill'} '${skillName}' already exists for ${adapter.displayName}. Skipping. Use --force to overwrite.`));
            continue;
        }

        // 4. Copy Files
        try {
            const stats = await fs.stat(sourcePath);
            await fs.ensureDir(path.dirname(targetDir)); // Ensure parent dir exists

            // If it's a file (often true for workflows), copy ensuring directory exists
            // If it's a dir (often true for skills), copy recursively
            if (stats.isFile()) {

                if (type === 'workflow' && stats.isFile()) {
                    // Ensure parent exists
                    await fs.ensureDir(path.dirname(targetDir));
                    await fs.copy(sourcePath, targetDir, { overwrite: options.force });
                } else {
                    // Skill behavior (existing)
                    // It creates the skill folder and puts content in it.
                    await fs.ensureDir(targetDir);
                    if (stats.isFile()) {
                        await fs.copy(sourcePath, path.join(targetDir, path.basename(sourcePath)), { overwrite: options.force });
                    } else {
                        await fs.copy(sourcePath, targetDir, { overwrite: options.force });
                    }
                }

            } else {
                await fs.ensureDir(targetDir);
                await fs.copy(sourcePath, targetDir, { overwrite: options.force });
            }
        } catch (err: any) {
            console.error(chalk.red(`Failed to install ${type || 'skill'} for ${adapter.displayName}: ${err.message}`));
        }
    }

    // 5. Update Config
    const configManager = new ConfigManager();
    await configManager.addInstalledSkill({
        name: skillName,
        source: originalSource || sourcePath,
        type: type || 'skill',
        installedAt: new Date().toISOString()
    });

    return true;
}
