import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../utils/config';

export function registerListCommand(program: Command) {
    program
        .command('list')
        .description('List installed skills and workflows')
        .action(async () => {
            const configManager = new ConfigManager();
            const config = await configManager.load();

            if (!config || !config.installed || config.installed.length === 0) {
                console.log(chalk.yellow('No skills installed yet.'));
                return;
            }

            if (config?.agents && config.agents.length > 0) {
                console.log(chalk.dim(`Configured Agents: ${config.agents.join(', ')}`));
            }

            console.log(chalk.bold.cyan('\n🌸 Installed Skills:\n'));
            config.installed.forEach(skill => {
                console.log(`- ${chalk.green(skill.name)} (from: ${skill.source})`);
                if (skill.installedAt) {
                    console.log(`  Installed: ${new Date(skill.installedAt).toLocaleString()}`);
                }
            });
            console.log('');
        });
}
