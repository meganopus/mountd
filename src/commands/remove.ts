import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import { ConfigManager } from '../utils/config';
import ora from 'ora';
import os from 'node:os';
import { isLegacyWorkflowRecord } from '../utils/install-type';

export function registerRemoveCommand(program: Command) {
    program
        .command('remove')
        .description('Remove an installed item (legacy workflows supported)')
        .argument('<name>', 'Name of the skill to remove')
        .option('-g, --global', 'Use global config/install paths (home directory)')
        .action(async (name: string, opts: { global?: boolean }) => {
            const useGlobal = !!opts.global || !!program.opts().global;
            const mountRoot = useGlobal ? os.homedir() : process.cwd();
            const spinner = ora(`Removing skill ${name}...`).start();

            try {
                const configManager = new ConfigManager(mountRoot);
                const configBefore = await configManager.load();
                const removedEntry = configBefore?.installed?.find(item => item.name === name);
                const shouldCleanupLegacyWorkflowPath = isLegacyWorkflowRecord(removedEntry);
                const removed = await configManager.removeInstalledSkill(name);

                if (removed) {
                    // Try to remove directory from all configured agents
                    const config = await configManager.load();
                    const agents = config?.agents || [];

                    if (agents.length === 0) {
                        spinner.succeed(chalk.green(`Removed skill '${name}' from configuration.`));
                        return;
                    }

                    const { getAdapterByName } = await import('../adapters');
                    let removedAny = false;

                    for (const agentName of agents) {
                        const adapter = getAdapterByName(agentName);
                        if (!adapter) continue;
                        if (useGlobal && !adapter.supportsGlobalInstall) continue;

                        // Try removing as skill
                        const skillDir = useGlobal
                            ? adapter.getGlobalSkillPath(mountRoot, name)
                            : adapter.getSkillPath(mountRoot, name);
                        if (await fs.pathExists(skillDir)) {
                            await fs.remove(skillDir);
                            removedAny = true;
                            console.log(chalk.dim(`  - Deleted skill from ${adapter.displayName}: ${skillDir}`));
                        }

                        if (shouldCleanupLegacyWorkflowPath) {
                            const workflowDir = useGlobal
                                ? adapter.getGlobalWorkflowPath(mountRoot, name)
                                : adapter.getWorkflowPath(mountRoot, name);
                            if (await fs.pathExists(workflowDir)) {
                                await fs.remove(workflowDir);
                                removedAny = true;
                                console.log(chalk.dim(`  - Deleted legacy workflow path from ${adapter.displayName}: ${workflowDir}`));
                            }
                        }
                    }

                    if (removedAny) {
                        spinner.succeed(chalk.green(`Removed skill '${name}' and deleted its files for all agents.`));
                    } else {
                        spinner.succeed(chalk.yellow(`Removed '${name}' from config, but no associated directories were found.`));
                    }
                } else {
                    spinner.fail(chalk.red(`Skill '${name}' not found in configuration.`));
                }

            } catch (error: any) {
                spinner.fail(chalk.red(`Failed to remove skill: ${error.message}`));
            }
        });
}
