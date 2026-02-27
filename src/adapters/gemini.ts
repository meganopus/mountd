import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Gemini.
 * Detects `.gemini/` directory and installs skills to `.agents/skills/` (project).
 */
export class GeminiAdapter implements AgentAdapter {
    readonly name = 'gemini';
    readonly displayName = 'Gemini Code Assist';
    readonly supportsGlobalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.gemini'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agents', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agents', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(homeDir, '.gemini', 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(homeDir, '.gemini', 'workflows', workflowName);
    }
}
