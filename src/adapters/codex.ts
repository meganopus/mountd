import { AgentAdapter } from './base';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

/**
 * Adapter for OpenAI Codex.
 * Detects .agents/skills in the repo tree, $HOME/.agents/skills, or /etc/codex/skills.
 */
export class CodexAdapter implements AgentAdapter {
    readonly name = 'codex';
    readonly displayName = 'OpenAI Codex';
    readonly supportsGlobalInstall = true;
    readonly supportsLocalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        const repoSkills = await this.findRepoSkillsDir(cwd);
        if (repoSkills) return true;

        const homeSkills = path.join(os.homedir(), '.agents', 'skills');
        if (await fs.pathExists(homeSkills)) return true;

        if (process.platform !== 'win32') {
            const etcSkills = path.join(path.sep, 'etc', 'codex', 'skills');
            if (await fs.pathExists(etcSkills)) return true;
        }

        return false;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agents', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agents', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(homeDir, '.agents', 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(homeDir, '.agents', 'workflows', workflowName);
    }

    private async findRepoSkillsDir(startDir: string): Promise<string | null> {
        let current = path.resolve(startDir);
        let prev = '';
        while (current !== prev) {
            const skillsDir = path.join(current, '.agents', 'skills');
            if (await fs.pathExists(skillsDir)) return skillsDir;

            const gitDir = path.join(current, '.git');
            if (await fs.pathExists(gitDir)) return null;

            prev = current;
            current = path.dirname(current);
        }
        return null;
    }
}
