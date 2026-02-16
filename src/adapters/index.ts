export { AgentAdapter } from './base';
export { AntigravityAdapter } from './antigravity';
export { GeminiAdapter } from './gemini';
export { CursorAdapter } from './cursor';
export { CopilotAdapter } from './copilot';
export { OpenCodeAdapter } from './opencode';
export { ClaudeCodeAdapter } from './claude';
export { KiloCodeAdapter } from './kilocode';
export { ClineAdapter } from './cline';
export { RooCodeAdapter } from './roocode';
export { TraeAdapter } from './trae';
export { WindsurfAdapter } from './windsurf';
export { GenericAdapter } from './generic';

import { AntigravityAdapter } from './antigravity';
import { GeminiAdapter } from './gemini';
import { CursorAdapter } from './cursor';
import { CopilotAdapter } from './copilot';
import { OpenCodeAdapter } from './opencode';
import { ClaudeCodeAdapter } from './claude';
import { KiloCodeAdapter } from './kilocode';
import { ClineAdapter } from './cline';
import { RooCodeAdapter } from './roocode';
import { TraeAdapter } from './trae';
import { WindsurfAdapter } from './windsurf';
import { GenericAdapter } from './generic';
import { AgentAdapter } from './base';

/**
 * Registry of all available agent adapters.
 * Adapters are checked in order - first match wins.
 * Antigravity is before Gemini because it detects `.gemini/antigravity/` (more specific).
 * GenericAdapter should always be last as it's the fallback.
 */
export const AGENT_ADAPTERS: AgentAdapter[] = [
    new AntigravityAdapter(),
    new GeminiAdapter(),
    new CursorAdapter(),
    new CopilotAdapter(),
    new OpenCodeAdapter(),
    new ClaudeCodeAdapter(),
    new KiloCodeAdapter(),
    new ClineAdapter(),
    new RooCodeAdapter(),
    new TraeAdapter(),
    new WindsurfAdapter(),
    new GenericAdapter()
];

/**
 * Get an adapter by name.
 */
export function getAdapterByName(name: string): AgentAdapter | undefined {
    return AGENT_ADAPTERS.find(adapter => adapter.name === name);
}
