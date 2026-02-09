import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import { ConfigManager } from '../utils/config';
import ora from 'ora';

export function registerRemoveCommand(program: Command) {
    program
        .command('remove')
        .description('Remove a skill or workflow')
        .argument('<name>', 'Name of the skill to remove')
        .action(async (name) => {
            const spinner = ora(`Removing skill ${name}...`).start();

            try {
                const configManager = new ConfigManager();
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

                        const targetDir = adapter.getSkillPath(process.cwd(), name);
                        if (await fs.pathExists(targetDir)) {
                            await fs.remove(targetDir);
                            removedAny = true;
                            console.log(chalk.dim(`  - Deleted from ${adapter.displayName}: ${targetDir}`));
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
