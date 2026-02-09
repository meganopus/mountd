import chalk from 'chalk';
import { installLocalSkill } from '../utils/file-ops';
import ora from 'ora';
import { parseGitHubUrl, downloadGitHubRepoZip, getGitHubRawUrl, downloadFile, downloadAndExtractZip, parseRegistryJson, RegistryItem } from '../utils/download';
import path from 'node:path';
import fs from 'fs-extra';
import { select, checkbox } from '@inquirer/prompts';
import checkboxPlus from 'inquirer-checkbox-plus-plus';
import os from 'node:os';
import { program } from '../cli';
import { ConfigManager } from '../utils/config';
import { detectAgents } from '../utils/detect-agent';

import { resolveBundleContents, BundleResolution } from '../utils/registry';

export async function handleInstall(source: string | undefined, items: string[] | { force?: boolean }, options?: { force?: boolean }) {
    // Handle both signatures: (source, items[], options) and (source, options)
    let itemsToInstall: string[] = [];
    let opts: { force?: boolean } = {};

    if (Array.isArray(items)) {
        itemsToInstall = items;
        opts = options || {};
    } else {
        opts = items || {};
    }

    const spinner = ora().start();

    // Handle reinstall from .mountdrc.json when no source provided
    if (!source) {
        spinner.text = 'Reading .mountdrc.json...';
        const { ConfigManager } = await import('../utils/config');
        const configManager = new ConfigManager();
        const config = await configManager.load();

        if (!config || !config.installed || config.installed.length === 0) {
            spinner.fail(chalk.yellow('No installed skills found in .mountdrc.json'));
            return;
        }

        spinner.succeed(chalk.green(`Found ${config.installed.length} skill(s) to reinstall`));

        // Reinstall each item by recursively calling this command
        for (const item of config.installed) {
            console.log(chalk.blue(`\nReinstalling: ${item.name} from ${item.source}`));

            try {
                // If we have type info, use it to install directly without spawning CLI
                // This preserves the type information that CLI args might lose (if we don't have a flag)
                if (item.type) {
                    const agents = await detectAgents();
                    await installLocalSkill(item.source, opts, item.source, agents, item.type);
                } else {
                    // Fallback for old config without type: try to detect or just run via CLI
                    // (Running via CLI might default to 'skill' type inside handleInstall if not specified)
                    await program.parseAsync(['node', 'mountd', item.source, ...(opts.force ? ['--force'] : [])], { from: 'user' });
                }
                console.log(chalk.green(`✓ Reinstalled ${item.name}`));
            } catch (error: any) {
                console.error(chalk.red(`✗ Failed: ${error.message}`));
            }
        }

        console.log(chalk.green('\n✓ Reinstall complete!'));
        return;
    }

    const originalSource = source;

    try {
        // 1. Detect user/repo shorthand (e.g., "user/repo")
        const isShorthand = !source.startsWith('http') && !source.startsWith('.') && !source.startsWith('/') && source.includes('/');

        if (isShorthand) {
            // Convert user/repo to full GitHub URL
            source = `https://github.com/${source}`;
        }

        // 2. Handle URL
        if (source.startsWith('http') || source.startsWith('https')) {
            spinner.text = `Analyzing source: ${source}...`;

            const ghInfo = parseGitHubUrl(source);

            if (ghInfo && ghInfo.type === 'blob') {
                // Case A: Single File (Blob)
                spinner.text = `Downloading file from GitHub...`;
                const rawUrl = getGitHubRawUrl(ghInfo);
                const tmpFile = path.join(os.tmpdir(), `mountd-file-${Date.now()}`, path.basename(ghInfo.path || 'skill.md'));
                await fs.ensureDir(path.dirname(tmpFile));

                await downloadFile(rawUrl, tmpFile);
                spinner.succeed(chalk.green(`Downloaded ${path.basename(tmpFile)}`));

                const agents = await detectAgents();
                // If it's a blob, it might be a single file workflow or skill.
                // For now, we don't know unless we infer from extension or user input.
                // defaulting to skill (undefined type)
                await installLocalSkill(tmpFile, opts, originalSource, agents); // Pass original URL
                await fs.remove(path.dirname(tmpFile));
            }
            else if (ghInfo) {
                // Case B: GitHub Repo (Tree or Root)
                spinner.text = `Fetching repository archive...`;
                const repoRoot = await downloadGitHubRepoZip(ghInfo);

                try {
                    let sourceDir = repoRoot;
                    let skillNameDisplay = ghInfo.repo;

                    if (ghInfo.path) {
                        // Specific path provided (Tree)
                        sourceDir = path.join(repoRoot, ghInfo.path);
                        skillNameDisplay = path.basename(ghInfo.path);
                        spinner.succeed(chalk.green(`Extracted ${skillNameDisplay}`));

                        const agents = await detectAgents();
                        await installLocalSkill(sourceDir, opts, originalSource, agents); // Pass original URL
                        spinner.succeed(chalk.green(`Successfully installed ${skillNameDisplay}`));
                    } else {
                        // Repo Root - Check for registry.json
                        spinner.text = 'Reading registry...';
                        const items = await parseRegistryJson(repoRoot);
                        spinner.stop();

                        let selectedItems: RegistryItem[];

                        // If items specified via CLI, use those directly
                        if (itemsToInstall.length > 0) {
                            selectedItems = items.filter(item => itemsToInstall.includes(item.name));
                            const notFound = itemsToInstall.filter(name => !items.find(item => item.name === name));
                            if (notFound.length > 0) {
                                console.warn(chalk.yellow(`Warning: The following items were not found in the registry: ${notFound.join(', ')}`));
                            }
                            if (selectedItems.length === 0) {
                                spinner.fail(chalk.red('No matching items found in the registry.'));
                                return;
                            }
                        } else {
                            // Load config to pre-select installed skills
                            const configManager = new ConfigManager();
                            const config = await configManager.load();
                            const installedSkillNames = new Set(config?.installed?.map(s => s.name) || []);

                            // Multi-select with searchable checkbox
                            // Handle potential ESM/CJS default export mismatch from bundler
                            const checkboxPlusFn = (checkboxPlus as any).default || checkboxPlus;
                            selectedItems = await checkboxPlusFn({
                                message: 'Select skills/workflows to install:',
                                searchable: true,
                                source: async (answersSoFar: Record<string, any>, input: string) => {
                                    const filtered = items.filter(item =>
                                        item.name.toLowerCase().includes((input || '').toLowerCase()) ||
                                        (item.description && item.description.toLowerCase().includes((input || '').toLowerCase()))
                                    );
                                    return filtered.map(item => {
                                        const coloredName = item.type === 'bundle'
                                            ? chalk.bold.yellow(item.name)
                                            : item.type === 'workflow'
                                                ? chalk.bold.magenta(item.name)
                                                : chalk.bold.cyan(item.name);
                                        return {
                                            name: item.description
                                                ? `${coloredName} ${chalk.dim(item.description)}`
                                                : coloredName,
                                            value: item,
                                            checked: installedSkillNames.has(item.name)
                                        };
                                    });
                                },
                                loop: false,
                                theme: {
                                    icon: {
                                        checked: chalk.green('◉'),
                                        unchecked: chalk.dim('○'),
                                        cursor: chalk.cyan('❯')
                                    }
                                }
                            });
                            if (selectedItems.length === 0) {
                                spinner.info(chalk.yellow('No items selected. Exiting.'));
                                return;
                            }
                        }

                        // Coding agents selection
                        const agents = await detectAgents();
                        console.log(chalk.blue(`Using agents: ${chalk.bold(agents.map(a => a.displayName).join(', '))}`));

                        // Install each selected item
                        const finalItemsToInstall: RegistryItem[] = [];
                        const missingItems: string[] = [];

                        for (const item of selectedItems) {
                            const resolution = resolveBundleContents(items, item);
                            finalItemsToInstall.push(...resolution.valid);
                            missingItems.push(...resolution.missing);
                        }

                        if (missingItems.length > 0) {
                            console.warn(chalk.yellow(`\nWarning: The following items referenced in bundles were not found in the registry:`));
                            missingItems.forEach(missing => console.warn(chalk.yellow(`  - ${missing}`)));
                            console.warn(chalk.yellow(`Continuing with installation of available items...\n`));
                        }

                        // Deduplicate final items
                        const uniqueItems = Array.from(new Map(finalItemsToInstall.map(item => [item.name, item])).values());

                        for (const item of uniqueItems) {
                            if (item.type === 'bundle') continue; // Should be resolved by now, but just in case

                            spinner.start(`Installing ${item.name}...`);
                            const itemPath = path.join(repoRoot, item.path);

                            if (!await fs.pathExists(itemPath)) {
                                spinner.warn(chalk.yellow(`Path not found: ${item.path}. Skipping.`));
                                continue;
                            }

                            // Build source URL for this specific item
                            const itemSource = `${source}/tree/${ghInfo.ref || 'main'}/${item.path}`;
                            // Pass item.type (skill or workflow) to installLocalSkill
                            await installLocalSkill(itemPath, opts, itemSource, agents, item.type);
                            spinner.succeed(chalk.green(`Installed ${item.name}`));
                        }
                    }
                } finally {
                    await fs.remove(path.dirname(repoRoot));
                }
            } else {
                // Case C: Generic Zip or Raw URL (Non-GitHub)
                // TODO: Implement generic zip/file detection logic
                // For now assume generic ZIP if ends in .zip
                if (source.endsWith('.zip')) {
                    spinner.text = `Downloading zip...`;
                    const tmpDir = path.join(os.tmpdir(), `mountd-zip-${Date.now()}`);
                    await downloadAndExtractZip(source, tmpDir);

                    // assume root of zip is the skill? Or list?
                    // let's assume root for now or similar interactive logic.
                    // For MVP: install the whole zip content as one skill?
                    // Usually zip has top level folder.
                    const files = await fs.readdir(tmpDir);
                    const rootDir = files.find(f => fs.statSync(path.join(tmpDir, f)).isDirectory());
                    const sourceDir = rootDir ? path.join(tmpDir, rootDir) : tmpDir;

                    const agents = await detectAgents();
                    await installLocalSkill(sourceDir, opts, undefined, agents);
                    await fs.remove(tmpDir);
                    spinner.succeed(chalk.green(`Successfully installed from zip`));
                } else {
                    // Assume single raw file
                    spinner.text = `Downloading file...`;
                    const fileName = path.basename(source);
                    const tmpFile = path.join(os.tmpdir(), `mountd-raw-${Date.now()}`, fileName);
                    await fs.ensureDir(path.dirname(tmpFile));
                    await downloadFile(source, tmpFile);

                    const agents = await detectAgents();
                    await installLocalSkill(tmpFile, opts, originalSource, agents);
                    await fs.remove(path.dirname(tmpFile));
                    spinner.succeed(chalk.green(`Successfully installed ${fileName}`));
                }
            }
        } else if (source.startsWith('@')) {
            // Registry shorthand (Future)
            spinner.fail(chalk.yellow('Registry shorthand not supported yet. Use full URL.'));
        } else {
            // Local Path
            const agents = await detectAgents();
            await installLocalSkill(source, opts, originalSource, agents);
            spinner.succeed(chalk.green(`Successfully installed skill from ${source}`));
        }
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.fail(chalk.red(error.message));
        } else {
            console.error(chalk.red(error.message));
        }
        process.exit(1);
    }
}
