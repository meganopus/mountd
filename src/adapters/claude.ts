import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for Claude Code.
 * Detects `.claude/` directory or `CLAUDE.md` file
 * and installs skills to `.claude/skills/` and workflows to `.claude/commands/`
 */
export class ClaudeCodeAdapter implements AgentAdapter {
    readonly name = 'claude';
    readonly displayName = 'Claude Code';

    async detect(cwd: string): Promise<boolean> {
        const hasClaudeDir = await fs.pathExists(path.join(cwd, '.claude'));
        const hasClaudeMd = await fs.pathExists(path.join(cwd, 'CLAUDE.md'));
        return hasClaudeDir || hasClaudeMd;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.claude', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.claude', 'commands', workflowName);
    }
}
