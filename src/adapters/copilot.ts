import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for GitHub Copilot.
 * Detects `.github/copilot/` directory and installs to `.github/copilot/`
 */
export class CopilotAdapter implements AgentAdapter {
    readonly name = 'copilot';
    readonly displayName = 'GitHub Copilot';

    async detect(cwd: string): Promise<boolean> {
        return await fs.pathExists(path.join(cwd, '.github', 'copilot'));
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.github', 'copilot', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.github', 'copilot', 'workflows', workflowName);
    }
}
