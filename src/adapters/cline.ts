import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Cline.
 * Detects `.cline/` directory or `.clinerules` file
 * and installs skills to `.cline/skills/` and workflows to `.cline/workflows/`
 */
export class ClineAdapter implements AgentAdapter {
    readonly name = 'cline';
    readonly displayName = 'Cline';

    async detect(cwd: string): Promise<boolean> {
        const hasClineDir = await fs.pathExists(path.join(cwd, '.cline'));
        const hasClineRules = await fs.pathExists(path.join(cwd, '.clinerules'));
        return hasClineDir || hasClineRules;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.cline', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.clinerules', 'workflows', workflowName);
    }
}
