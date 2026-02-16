import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Windsurf.
 * Detects `.windsurfrules` file or `.windsurf/` directory
 * and installs skills to `.windsurf/skills/` and workflows to `.windsurf/workflows/`
 */
export class WindsurfAdapter implements AgentAdapter {
    readonly name = 'windsurf';
    readonly displayName = 'Windsurf';

    async detect(cwd: string): Promise<boolean> {
        const hasWindsurfRules = await fs.pathExists(path.join(cwd, '.windsurfrules'));
        const hasWindsurfDir = await fs.pathExists(path.join(cwd, '.windsurf'));
        return hasWindsurfRules || hasWindsurfDir;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.windsurf', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.windsurf', 'workflows', workflowName);
    }
}
