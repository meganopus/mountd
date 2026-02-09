import { Command } from 'commander';
import chalk from 'chalk';
import { handleInstall } from './commands/add';
import { registerListCommand } from './commands/list';
import { registerRemoveCommand } from './commands/remove';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

export const program = new Command();

program
    .name('mountd')
    .description('AI Agent Skill/Workflow Distribution CLI')
    .version(pkg.version)
    .argument('[source]', 'Source to install (user/repo, URL, or local path). Leave empty to reinstall from .mountdrc.json')
    .argument('[items...]', 'Specific items to install from the registry (optional)')
    .option('-f, --force', 'Overwrite existing files')
    .action(handleInstall);

registerListCommand(program);
registerRemoveCommand(program);
