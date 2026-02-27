import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for GitHub Copilot.
 * Detects `.github/copilot-instructions.md` and installs skills to `.agents/skills/` (project).
 */
export class CopilotAdapter implements AgentAdapter {
    readonly name = 'copilot';
    readonly displayName = 'GitHub Copilot';
    readonly supportsGlobalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        const hasInstructions = await fs.pathExists(path.join(cwd, '.github', 'copilot-instructions.md'));
        const hasCopilotDir = await fs.pathExists(path.join(cwd, '.copilot'));
        return hasInstructions || hasCopilotDir;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agents', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agents', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(homeDir, '.copilot', 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(homeDir, '.copilot', 'workflows', workflowName);
    }
}
