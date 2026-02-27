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
    readonly supportsGlobalInstall = true;

    async detect(cwd: string): Promise<boolean> {
        const hasOpenCodeDir = await fs.pathExists(path.join(cwd, '.opencode'));
        const hasOpenCodeJson = await fs.pathExists(path.join(cwd, 'opencode.json'));
        return hasOpenCodeDir || hasOpenCodeJson;
    }

    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.agents', 'skills', skillName);
    }

    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.agents', 'workflows', workflowName);
    }

    getGlobalSkillPath(homeDir: string, skillName: string): string {
        return path.join(this.getGlobalConfigDir(homeDir), 'skills', skillName);
    }

    getGlobalWorkflowPath(homeDir: string, workflowName: string): string {
        return path.join(this.getGlobalConfigDir(homeDir), 'workflows', workflowName);
    }

    private getGlobalConfigDir(homeDir: string): string {
        if (process.platform === 'win32') {
            const appData = process.env.APPDATA;
            if (appData && appData.trim().length > 0) return path.join(appData, 'opencode');
            return path.join(homeDir, 'AppData', 'Roaming', 'opencode');
        }
        // Prefer XDG-style config directory when available.
        const xdg = process.env.XDG_CONFIG_HOME;
        if (xdg && xdg.trim().length > 0) return path.join(xdg, 'opencode');
        // Fallback to `~/.config/opencode` (documented for macOS/Linux).
        return path.join(homeDir, '.config', 'opencode');
    }
}
