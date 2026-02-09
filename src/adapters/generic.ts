import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Generic fallback adapter.
 * Always detects successfully and installs to `.agent/` directory.
 * Used when no specific agent is detected.
 */
export class GenericAdapter implements AgentAdapter {
    readonly name = 'generic';
    readonly displayName = 'Generic / Other';

    async detect(cwd: string): Promise<boolean> {
        // Check if .agent directory exists, or always return true as fallback
        return await fs.pathExists(path.join(cwd, '.agent')) || true;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agent', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agent', 'workflows', workflowName);
    }
}
