import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for OpenCode (OpenCod).
 * Detects `.opencode/` directory and installs skills to `.opencode/skills/`
 */
export class OpenCodeAdapter implements AgentAdapter {
    readonly name = 'opencode';
    readonly displayName = 'OpenCode';

    async detect(cwd: string): Promise<boolean> {
        const hasOpenCodeDir = await fs.pathExists(path.join(cwd, '.opencode'));
        const hasOpenCodeJson = await fs.pathExists(path.join(cwd, 'opencode.json'));
        return hasOpenCodeDir || hasOpenCodeJson;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.opencode', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.opencode', 'commands', workflowName);
    }
}
