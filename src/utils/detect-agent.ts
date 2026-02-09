import path from 'node:path';
import { ConfigManager } from './config';
import { select, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { AGENT_ADAPTERS, AgentAdapter, getAdapterByName } from '../adapters';

/**
 * Detect which coding agents are being used in the current directory.
 * Returns an array of detected adapter instances.
 */
export async function detectAgents(cwd: string = process.cwd()): Promise<AgentAdapter[]> {
    const configManager = new ConfigManager(cwd);
    const config = await configManager.load();

    // 1. Get pre-selected agents from config or auto-detection
    const preSelectedNames = new Set<string>(config?.agents || []);

    // If no config, run auto-detection as a starting point
    if (preSelectedNames.size === 0) {
        for (const adapter of AGENT_ADAPTERS) {
            if (await adapter.detect(cwd)) {
                preSelectedNames.add(adapter.name);
            }
        }
    }

    // 2. Always prompt for selection
    const choices = AGENT_ADAPTERS.map(adapter => ({
        name: adapter.displayName,
        value: adapter.name,
        checked: preSelectedNames.has(adapter.name)
    }));

    const selected = await checkbox({
        message: 'Which AI agents are you using?',
        choices
    });

    if (selected.length === 0) {
        throw new Error('At least one AI agent must be selected.');
    }

    // Save preferences
    await configManager.update({ agents: selected as any });

    return selected
        .map((name: string) => getAdapterByName(name))
        .filter((a: AgentAdapter | undefined): a is AgentAdapter => !!a);
}
