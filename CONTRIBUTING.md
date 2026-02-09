# Contributing to Mountd

Thank you for your interest in contributing to Mountd! This guide will help you add support for new coding agents.

## Adding a New Agent Adapter

Mountd uses an adapter pattern to support different coding agents. Adding support for a new agent is straightforward!

### Step 1: Create Your Adapter File

Create a new file in `src/adapters/` named after your agent (e.g., `windsurf.ts`):

```typescript
import { AgentAdapter } from './base';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Adapter for [Your Agent Name].
 * Detects [detection criteria] and installs to [installation path]
 */
export class YourAgentAdapter implements AgentAdapter {
    readonly name = 'your-agent';  // Unique identifier (lowercase, no spaces)
    readonly displayName = 'Your Agent Name';  // Human-readable name

    /**
     * Detect if this agent is being used.
     * Check for config files, directories, or other indicators.
     */
    async detect(cwd: string): Promise<boolean> {
        // Example: Check if a config directory exists
        return await fs.pathExists(path.join(cwd, '.youragent'));
    }

    /**
     * Get the path where skills should be installed.
     */
    getSkillPath(cwd: string, skillName: string): string {
        return path.join(cwd, '.youragent', 'skills', skillName);
    }

    /**
     * Get the path where workflows should be installed.
     */
    getWorkflowPath(cwd: string, workflowName: string): string {
        return path.join(cwd, '.youragent', 'workflows', workflowName);
    }
}
```

### Step 2: Register Your Adapter

Add your adapter to `src/adapters/index.ts`:

```typescript
// 1. Import your adapter
export { YourAgentAdapter } from './your-agent';
import { YourAgentAdapter } from './your-agent';

// 2. Add to the registry (before GenericAdapter)
export const AGENT_ADAPTERS: AgentAdapter[] = [
    new GeminiAdapter(),
    new CursorAdapter(),
    new CopilotAdapter(),
    new YourAgentAdapter(),  // Add here
    new GenericAdapter()      // Keep this last!
];
```

### Step 3: Update TypeScript Types

Add your agent type to `src/types/index.ts`:

```typescript
export type AgentType = 'gemini' | 'cursor' | 'copilot' | 'your-agent' | 'generic';
```

### Step 4: Test Your Adapter

1. Build the project:
   ```bash
   bun run build
   ```

2. Test detection:
   ```bash
   # Create test directory structure
   mkdir -p test-project/.youragent
   cd test-project
   
   # Try installing a skill
   npx mountd ./path/to/skill
   ```

3. Verify it detects your agent and installs to the correct location.

## Detection Best Practices

### What to Check For

Good detection strategies check for:
- **Config directories**: `.youragent/`, `.youragent-config/`
- **Config files**: `.youragentrc`, `.youragent.json`
- **Lock files**: `youragent.lock`
- **Package markers**: Specific entries in `package.json`

### Detection Order

Adapters are checked in the order they appear in `AGENT_ADAPTERS`. Make sure:
- More specific checks come before generic ones
- `GenericAdapter` is always last (it's the fallback)

### Example: Multiple Detection Criteria

```typescript
async detect(cwd: string): Promise<boolean> {
    // Check for directory OR config file
    const hasDir = await fs.pathExists(path.join(cwd, '.youragent'));
    const hasConfig = await fs.pathExists(path.join(cwd, '.youragentrc'));
    return hasDir || hasConfig;
}
```

## Path Structure Guidelines

### Skills vs Workflows

- **Skills**: Typically directories with multiple files (SKILL.md, scripts/, etc.)
- **Workflows**: Often single markdown files

### Recommended Structure

```
.youragent/
├── skills/
│   └── my-skill/
│       ├── SKILL.md
│       └── scripts/
└── workflows/
    └── my-workflow.md
```

## Submitting Your Adapter

1. Fork the repository
2. Create a feature branch: `git checkout -b add-youragent-adapter`
3. Implement your adapter following this guide
4. Test thoroughly
5. Update README.md to list your agent in "Supported Agents"
6. Submit a pull request with:
   - Clear description of the agent
   - Link to agent documentation
   - Example detection scenario
