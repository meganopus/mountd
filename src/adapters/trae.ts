import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Trae AI.
 * Detects `.trae/` directory and installs skills to `.trae/skills/`
 * and workflows to `.trae/workflows/`
 */
export class TraeAdapter implements AgentAdapter {
    readonly name = 'trae';
    readonly displayName = 'Trae';

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.trae'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.trae', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.trae', 'workflows', workflowName);
    }
}
