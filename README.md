# 🌸 Mountd

**AI Agent Skill & Workflow Distribution CLI**

Mountd is a CLI tool that enables developers to easily discover, install, and manage AI agent skills and workflows across different agent environments (Gemini Code Assist, Cursor, GitHub Copilot, etc.).

## Features

-   **Zero-Install Execution**: Run directly via `npx mountd` without global installation.
-   **Shorthand Syntax**: Use `npx mountd user/repo` to install from GitHub repositories.
-   **Registry Support**: Repositories with `registry.json` show interactive multi-select checkbox interface.
-   **Auto-Reinstall**: Run `npx mountd` without arguments to reinstall all tracked skills from `.mountdrc.json`.
-   **Smart Detection**: Automatically detects your AI agent configuration (Gemini, Cursor, etc.) and installs skills to the correct location.
-   **Source Tracking**: All installations are tracked in `.mountdrc.json` with their original source URLs.
-   **Legacy Workflow Compatibility**: Existing `type: "workflow"` items are still accepted and auto-converted to skill installs.

## Usage

### Install Skills

Install skills or workflows directly without a command:

```bash
# From GitHub Repo Root (Interactive Selection)
npx mountd user/repo

# Reinstall all from .mountdrc.json
npx mountd
```

### Non-interactive installs

By default, `mountd` will prompt to select which agent(s) you use. For CI/E2E automation, you can disable prompts:

```bash
npx mountd user/repo --agents claude,cursor --no-prompt
```

You can also install from a local registry directory (a folder containing `registry.json`) without prompts by specifying item names:

```bash
npx mountd ./path/to/registry bundle-name --agents claude --no-prompt
```

### Global Mode

Use `--global` to store config in your home directory and install into home-based agent folders (e.g. `~/.claude/...`) instead of the current project.

```bash
# Install globally (uses ~/.mountdrc.json)
npx mountd --global user/repo

# List globally installed items
npx mountd --global list
```

### Workflow Deprecation (Legacy Support)

`workflow` is deprecated as a first-class install type. Mountd still accepts old `type: "workflow"` entries and installs them using canonical skill semantics.

For new registries, use `type: "skill"` only.

### List Installed Skills

See what skills you have installed in your current project.

```bash
npx mountd list
```

### Remove a Skill

Uninstall a skill.

```bash
npx mountd remove my-skill
```

## Supported Agents

Mountd currently supports auto-detection for:

-   **Antigravity**: `.agent/skills/`
-   **Gemini Code Assist**: `.agents/skills/` (project) and `~/.gemini/skills/` (global)
-   **Cursor**: `.agents/skills/` (project) and `~/.cursor/skills/` (global)
-   **GitHub Copilot**: `.agents/skills/` (project) and `~/.copilot/skills/` (global)
-   **OpenCode**: `.agents/skills/` (project) and `~/.config/opencode/skills/` (global)
-   **Claude Code**: `.claude/skills/`
-   **Kilo Code**: `.kilocode/skills/`
-   **Cline**: `.cline/skills/`
-   **Roo Code**: `.roo/skills/`
-   **Trae**: `.trae/skills/`
-   **Windsurf**: `.windsurf/skills/` (project) and `~/.codeium/windsurf/skills/` (global)
-   **Generic**: `.agents/skills/` (project) and `~/.config/agents/skills/` (global)

## Creating a Mountd-Compatible Repo

You can host your own skills on GitHub. We recommend the following structure:

```
my-skills-repo/
├── skills/
│   ├── git-workflow/      # Skill Name
│   │   ├── SKILL.md       # Main instruction file
│   │   └── scripts/       # Helper scripts
│   └── react-refactor/
│       └── ...
├── workflows/
│   └── deploy.md
├── registry.json          # REQUIRED for interactive selection
└── README.md
```

### The `registry.json` File

To enable the `npx mountd user/repo` shorthand and interactive selection, you must include a `registry.json` file in the root of your repository:

```json
{
  "name": "My Skills Registry",
  "description": "A collection of useful AI skills",
  "items": [
    {
      "name": "git-workflow",
      "path": "skills/git-workflow",
      "type": "skill",
      "description": "Standard git commit workflow"
    },
    {
      "name": "deploy-workflow",
      "path": "skills/deploy-workflow",
      "type": "skill",
      "description": "Deployment instructions"
    },
    {
      "name": "starter-bundle",
      "type": "bundle",
      "description": "All essential skills for new projects",
      "includes": ["git-workflow", "deploy-workflow"]
    }
  ]
}
```

### Item Types

| Type       | Description                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `skill`    | A folder containing `SKILL.md` and supporting files                      |
| `workflow` | Deprecated legacy type; auto-converted to `skill` install semantics      |
| `bundle`   | A collection of skills/workflows that are installed together as a group  |

> **Note:** Bundles don't have a `path` property—they reference other items by name via the `includes` array. If any referenced item doesn't exist in the registry, a warning is shown but installation continues with available items.

When users run `npx mountd <your-repo-url>`, they will be able to interactively select `git-workflow`, `react-refactor`, or `deploy-workflow`.
