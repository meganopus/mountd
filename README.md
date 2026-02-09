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

## Usage

### Install Skills

Install skills or workflows directly without a command:

```bash
# From GitHub Repo Root (Interactive Selection)
npx mountd user/repo

# Reinstall all from .mountdrc.json
npx mountd
```

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

-   **Gemini Code Assist**: `.gemini/skills/`
-   **Cursor**: `.cursor/rules/`
-   **GitHub Copilot**: `.github/copilot/`
-   **Generic**: `.agent/workflows/`

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
      "path": "workflows/deploy.md",
      "type": "workflow",
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
| `workflow` | A single markdown file with workflow instructions                        |
| `bundle`   | A collection of skills/workflows that are installed together as a group  |

> **Note:** Bundles don't have a `path` property—they reference other items by name via the `includes` array. If any referenced item doesn't exist in the registry, a warning is shown but installation continues with available items.

When users run `npx mountd <your-repo-url>`, they will be able to interactively select `git-workflow`, `react-refactor`, or `deploy.md`.
