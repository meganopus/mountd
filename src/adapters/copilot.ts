import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for GitHub Copilot.
 * Detects `.github/copilot-instructions.md` or `.github/skills/` directory
 * and installs skills to `.github/skills/` and workflows to `.github/workflows/`
 */
export class CopilotAdapter implements AgentAdapter {
    readonly name = 'copilot';
    readonly displayName = 'GitHub Copilot';

    async detect(cwd: string): Promise<boolean> {
        const hasInstructions = await fs.pathExists(path.join(cwd, '.github', 'copilot-instructions.md'));
        const hasSkillsDir = await fs.pathExists(path.join(cwd, '.github', 'skills'));
        return hasInstructions || hasSkillsDir;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.github', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        const name = path.parse(workflowName).name;
        return path.join(cwd, '.github', 'skills', name, 'SKILL.md');
    }
}
