import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Antigravity (Google).
 * Detects `.gemini/antigravity/` directory
 * and installs skills and workflows to project-local `.agent/` directory
 */
export class AntigravityAdapter implements AgentAdapter {
    readonly name = 'antigravity';
    readonly displayName = 'Antigravity';
    readonly supportsGlobalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.gemini', 'antigravity'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agent', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agent', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(homeDir, '.gemini', 'antigravity', 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(homeDir, '.gemini', 'antigravity', 'workflows', workflowName);
    }
}
