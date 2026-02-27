import path from 'node:path';
import { ConfigManager } from './config';
import { select, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { AGENT_ADAPTERS, AgentAdapter, getAdapterByName } from '../adapters';

function normalizeAgentNames(input: string[] | string | undefined): string[] {
    if (!input) return [];
    const arr = Array.isArray(input) ? input : input.split(',');
    return arr.map(s => s.trim()).filter(Boolean);
}

/**
 * Detect which coding agents are being used in the current directory.
 * Returns an array of detected adapter instances.
 */
export async function detectAgents(
    cwd: string = process.cwd(),
    options?: { global?: boolean; agents?: string[] | string; noPrompt?: boolean }
): Promise<AgentAdapter[]> {
    const globalMode = !!options?.global;
    const configManager = new ConfigManager(cwd);
    const config = await configManager.load();

    const explicitAgents = normalizeAgentNames(options?.agents);
    const noPrompt = !!options?.noPrompt;

    if (explicitAgents.length > 0) {
        const adapters = explicitAgents.map(name => getAdapterByName(name));
        const missing = explicitAgents.filter((_, i) => !adapters[i]);
        if (missing.length > 0) {
            throw new Error(`Unknown agent adapter(s): ${missing.join(', ')}`);
        }
        const filtered = (adapters as AgentAdapter[]).filter(a => !globalMode || a.supportsGlobalInstall);
        if (filtered.length === 0) {
            throw new Error('No selected agents support --global.');
        }
        await configManager.update({ agents: filtered.map(a => a.name) as any });
        return filtered;
    }

    if (noPrompt) {
        const fromConfig = (config?.agents || []).filter(name => {
            const adapter = getAdapterByName(name);
            return !!adapter && (!globalMode || adapter.supportsGlobalInstall);
        });

        if (fromConfig.length > 0) {
            return fromConfig
                .map((name: string) => getAdapterByName(name))
                .filter((a: AgentAdapter | undefined): a is AgentAdapter => !!a);
        }

        // Auto-detect without prompting; fallback to GenericAdapter via detect order.
        const detected: AgentAdapter[] = [];
        for (const adapter of AGENT_ADAPTERS) {
            if (globalMode && !adapter.supportsGlobalInstall) continue;
            if (await adapter.detect(cwd)) detected.push(adapter);
        }

        if (detected.length === 0) {
            throw new Error('No AI agents detected and no agents configured. Use --agents to specify.');
        }

        await configManager.update({ agents: detected.map(a => a.name) as any });
        return detected;
    }

    // 1. Get pre-selected agents from config or auto-detection
    const preSelectedNames = new Set<string>(config?.agents || []);

    if (globalMode) {
        for (const adapter of AGENT_ADAPTERS) {
            if (!adapter.supportsGlobalInstall) preSelectedNames.delete(adapter.name);
        }
    }

    // If no config, run auto-detection as a starting point
    if (preSelectedNames.size === 0) {
        for (const adapter of AGENT_ADAPTERS) {
            if (globalMode && !adapter.supportsGlobalInstall) continue;
            if (await adapter.detect(cwd)) {
                preSelectedNames.add(adapter.name);
            }
        }
    }

    // 2. Always prompt for selection
    const choices = AGENT_ADAPTERS.map(adapter => ({
        name: adapter.displayName,
        value: adapter.name,
        checked: preSelectedNames.has(adapter.name),
        disabled: globalMode && !adapter.supportsGlobalInstall ? 'Does not support --global' : false
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
