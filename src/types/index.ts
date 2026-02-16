export type AgentType = 'gemini' | 'cursor' | 'copilot' | 'opencode' | 'claude' | 'kilocode' | 'cline' | 'roocode' | 'trae' | 'windsurf' | 'antigravity' | 'generic';

export interface InstalledSkill {
    name: string;
    source: string;
    version?: string;
    type?: 'skill' | 'workflow';
    installedAt: string;
}

export interface FlowerConfig {
    agents?: AgentType[];
    paths?: {
        skills?: string;
        workflows?: string;
    };
    defaults?: {
        overwrite?: boolean;
        validate?: boolean;
    };
    installed?: InstalledSkill[];
}

export interface AgentStrategy {
    type: AgentType;
    detect: (cwd: string) => Promise<boolean>;
    getSkillPath: (cwd: string, skillName: string) => string;
}
