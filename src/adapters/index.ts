export { AgentAdapter } from './base';
export { GeminiAdapter } from './gemini';
export { CursorAdapter } from './cursor';
export { CopilotAdapter } from './copilot';
export { GenericAdapter } from './generic';

import { GeminiAdapter } from './gemini';
import { CursorAdapter } from './cursor';
import { CopilotAdapter } from './copilot';
import { GenericAdapter } from './generic';
import { AgentAdapter } from './base';

/**
 * Registry of all available agent adapters.
 * Adapters are checked in order - first match wins.
 * GenericAdapter should always be last as it's the fallback.
 */
export const AGENT_ADAPTERS: AgentAdapter[] = [
    new GeminiAdapter(),
    new CursorAdapter(),
    new CopilotAdapter(),
    new GenericAdapter()
];

/**
 * Get an adapter by name.
 */
export function getAdapterByName(name: string): AgentAdapter | undefined {
    return AGENT_ADAPTERS.find(adapter => adapter.name === name);
}
