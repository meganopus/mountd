import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Generic fallback adapter.
 * Always detects successfully and installs to `.agents/` directory.
 * Used when no specific agent is detected.
 */
export class GenericAdapter implements AgentAdapter {
    readonly name = 'generic';
    readonly displayName = 'Generic / Other';
    readonly supportsGlobalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        // Check if .agents directory exists, or always return true as fallback
        return await fs.pathExists(path.join(cwd, '.agents')) || true;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agents', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agents', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(homeDir, '.config', 'agents', 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(homeDir, '.config', 'agents', 'workflows', workflowName);
    }
}
