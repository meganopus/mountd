import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Cursor.
 * Detects `.cursor/` directory or `.cursorrules` file and installs to `.cursor/rules/`
 */
export class CursorAdapter implements AgentAdapter {
    readonly name = 'cursor';
    readonly displayName = 'Cursor';

    async detect(cwd: string): Promise<boolean> {
        const hasCursorDir = await fs.pathExists(path.join(cwd, '.cursor'));
        const hasCursorRules = await fs.pathExists(path.join(cwd, '.cursorrules'));
        return hasCursorDir || hasCursorRules;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.cursor', 'rules', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.cursor', 'workflows', workflowName);
    }
}
