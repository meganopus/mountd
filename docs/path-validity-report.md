# Mountd adapter path validity report (local vs global)

Generated: 2026-02-25

This report cross-checks Mountd’s adapter install paths against publicly documented agent locations. When an agent does not support per-item global installs (or the docs don’t define a global filesystem location), it’s marked as unsupported/unverified.

Legend:
- **Verified**: explicitly documented by the vendor/project docs.
- **Partial**: documented concept exists, but Mountd’s install semantics differ (single file vs many items).
- **Unverified**: no authoritative docs found for the path; Mountd uses a convention.

## Summary table

| Adapter | Local path Mountd writes | Global path Mountd writes (`--global`) | Global supported? | Validity notes | Sources |
|---|---|---:|:---:|---|---|
| **Claude Code** | `.claude/skills/<skill>/` and `.claude/commands/<workflow>.md` | `~/.claude/skills/<skill>/` and `~/.claude/commands/<workflow>.md` | Yes | Verified local + global directories for skills + slash commands. | https://docs.anthropic.com/en/docs/claude-code/tutorials/creating-a-custom-slash-command • https://docs.anthropic.com/en/docs/claude-code/tutorials/creating-slash-commands |
| **OpenCode** | `.opencode/skills/<skill>/` and `.opencode/commands/<workflow>.md` | `~/.config/opencode/skills/<skill>/` and `~/.config/opencode/commands/<workflow>.md` (or `%APPDATA%\\opencode\\...` on Windows) | Yes | Verified local + global locations in docs for skills + commands (macOS/Linux). Windows path is best-effort using standard `APPDATA`. | https://opencode.ai/docs/commands/ • https://opencode.ai/docs/skills |
| **Kilo Code** | `.kilocode/skills/<skill>/` and `.kilocode/workflows/<workflow>` | `~/.kilocode/skills/<skill>/` and `~/.kilocode/workflows/<workflow>` | Yes | Verified local + global locations for skills + workflows. | https://kilocode.ai/docs/advanced-usage/global-rules |
| **Cline** | `.clinerules/<name>.md` | macOS/Windows: `~/Documents/Cline/Rules/<name>.md` • Linux: `~/.config/cline/rules/<name>.md` | Yes | Verified workspace rules in `.clinerules` and documented global rules locations. | https://docs.cline.bot/improving-your-prompting-skills/prompting/custom-instructions |
| **Cursor** | `.cursor/rules/<name>.mdc` | _Not supported_ (Cursor “User Rules” are configured in-app, not a documented per-file global rules directory) | No | Verified workspace rules in `.cursor/rules/*.mdc`. Mountd converts SKILL.md/workflow markdown into a `.mdc` rule file. | https://docs.cursor.com/context/rules • https://docs.cursor.com/context/rules#project-rules |
| **Windsurf** | `.windsurf/rules/<name>.md` | _Not supported_ | No | Verified workspace rules in `.windsurf/rules`. Global rules exist conceptually (`global_rules.md`) but Mountd does **not** manage the single-file global rules safely per item yet. | https://docs.codeium.com/windsurf/memories#workspace-rules • https://docs.codeium.com/windsurf/memories#global-rules |
| **GitHub Copilot** | `.github/copilot-instructions.md` (single file) | _Not supported_ | No | Verified repo-level custom instructions file. **Partial**: Mountd installs overwrite the same file (multi-item merge not implemented). | https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot |
| **Gemini Code Assist** | `.gemini/styleguide.md` (single file) | _Not supported_ | No | Verified `.gemini/` folder and supported files (including `styleguide.md`). **Partial**: Mountd treats installs as overwriting `styleguide.md`. | https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-custom-instructions-for-github-copilot#customizing-gemini-code-assist-behavior-in-githubcom |
| **Antigravity** | `.agent/skills/<skill>/` and `.agent/workflows/<workflow>` | _Not supported_ | No | Unverified: no authoritative docs located for filesystem skill/workflow paths. | (unverified) |
| **Roo Code** | `.roo/skills/<skill>/` and `.roo/workflows/<workflow>` | _Not supported_ | No | Unverified: no authoritative docs located for filesystem skill/workflow paths. | (unverified) |
| **Trae** | `.trae/skills/<skill>/` and `.trae/workflows/<workflow>` | _Not supported_ | No | Unverified: no authoritative docs located for filesystem skill/workflow paths. | (unverified) |
| **Generic / Other** | `.agent/skills/<skill>/` and `.agent/workflows/<workflow>` | _Not supported_ | No | Convention-only fallback; not vendor-documented. | (unverified) |

## Notes

- `~` means the current user’s home directory (`os.homedir()`).
- Mountd’s `--global` currently uses a global `.mountdrc.json` in the home directory, even when the agent’s global rules live elsewhere (e.g., Cline’s `Documents/Cline/Rules`).
