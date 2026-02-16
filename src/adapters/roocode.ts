import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Roo Code.
 * Detects `.roo/` directory and installs skills to `.roo/skills/`
 */
export class RooCodeAdapter implements AgentAdapter {
    readonly name = 'roocode';
    readonly displayName = 'Roo Code';

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.roo'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.roo', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.roo', 'workflows', workflowName);
    }
}
