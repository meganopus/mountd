import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Gemini Code Assist.
 * Detects `.gemini/` directory and installs to `.gemini/skills/`
 */
export class GeminiAdapter implements AgentAdapter {
    readonly name = 'gemini';
    readonly displayName = 'Gemini Code Assist';

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.gemini'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.gemini', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.gemini', 'workflows', workflowName);
    }
}
