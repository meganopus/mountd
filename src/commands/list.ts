import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../utils/config';
import os from 'node:os';
import { isLegacyWorkflowRecord, normalizeInstallType } from '../utils/install-type';

export function registerListCommand(program: Command) {
    program
        .command('list')
        .description('List installed items (legacy workflows shown as skill)')
        .option('-g, --global', 'Use global config (home directory)')
        .action(async (opts: { global?: boolean }) => {
            const useGlobal = !!opts.global || !!program.opts().global;
            const mountRoot = useGlobal ? os.homedir() : process.cwd();

            const configManager = new ConfigManager(mountRoot);
            const config = await configManager.load();

            if (!config || !config.installed || config.installed.length === 0) {
                console.log(chalk.yellow('No skills installed yet.'));
                return;
            }

            if (config?.agents && config.agents.length > 0) {
                console.log(chalk.dim(`Configured Agents: ${config.agents.join(', ')}`));
            }

            console.log(chalk.bold.cyan('\nInstalled Items:\n'));
            config.installed.forEach(skill => {
                const normalizedType = normalizeInstallType(skill.type);
                const legacyTag = isLegacyWorkflowRecord(skill) ? chalk.dim(' (legacy workflow)') : '';
                console.log(`- ${chalk.green(skill.name)} [${normalizedType.canonicalType}]${legacyTag} (from: ${skill.source})`);
                if (skill.installedAt) {
                    console.log(`  Installed: ${new Date(skill.installedAt).toLocaleString()}`);
                }
            });
            console.log('');
        });
}
