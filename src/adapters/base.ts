/**
 * Base interface for agent adapters.
 * Implement this interface to add support for a new coding agent.
 */
export interface AgentAdapter {
    /** Unique identifier for the agent (e.g., 'gemini', 'cursor') */
    readonly name: string;

    /** Human-readable display name (e.g., 'Gemini Code Assist', 'Cursor') */
    readonly displayName: string;

    /**
     * Whether this adapter supports global installs via `--global`.
     * If false, the adapter will be disabled/skipped in global mode.
     */
    readonly supportsGlobalInstall: boolean;

    /**
     * Detect if this agent is being used in the given directory.
     * @param cwd - Current working directory
     * @returns true if this agent is detected
     */
    detect(cwd: string): Promise<boolean>;

    /**
     * Get the installation path for a skill.
     * @param cwd - Current working directory
     * @param skillName - Name of the skill to install
     * @returns Absolute path where the skill should be installed
     */
    getSkillPath(cwd: string, skillName: string): string;

    /**
     * Get the installation path for a workflow.
     * @deprecated Workflows are legacy-only and normalized to `skill` installs.
     * @param cwd - Current working directory
     * @param workflowName - Name of the workflow to install
     * @returns Absolute path where the workflow should be installed
     */
    getWorkflowPath(cwd: string, workflowName: string): string;

    /**
     * Get the global installation path for a skill.
     * @param homeDir - User home directory
     * @param skillName - Name of the skill to install
     * @returns Absolute path where the skill should be installed globally
     */
    getGlobalSkillPath(homeDir: string, skillName: string): string;

    /**
     * Get the global installation path for a workflow.
     * @deprecated Workflows are legacy-only and normalized to `skill` installs.
     * @param homeDir - User home directory
     * @param workflowName - Name of the workflow to install
     * @returns Absolute path where the workflow should be installed globally
     */
    getGlobalWorkflowPath(homeDir: string, workflowName: string): string;
}
