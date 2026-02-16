import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Kilo Code.
 * Detects `.kilocode/` directory and installs skills to `.kilocode/skills/`
 */
export class KiloCodeAdapter implements AgentAdapter {
    readonly name = 'kilocode';
    readonly displayName = 'Kilo Code';

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.kilocode'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.kilocode', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.kilocode', 'workflows', workflowName);
    }
}
