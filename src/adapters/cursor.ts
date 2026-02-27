import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Cursor.
 * Detects `.cursor/` directory or `.cursorrules` file and installs skills to `.agents/skills/` (project).
 */
export class CursorAdapter implements AgentAdapter {
    readonly name = 'cursor';
    readonly displayName = 'Cursor';
    readonly supportsGlobalInstall = true;
    readonly supportsLocalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        const hasCursorDir = await fs.pathExists(path.join(cwd, '.cursor'));
        const hasCursorRules = await fs.pathExists(path.join(cwd, '.cursorrules'));
        return hasCursorDir || hasCursorRules;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agents', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agents', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(homeDir, '.cursor', 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(homeDir, '.cursor', 'workflows', workflowName);
    }
}
