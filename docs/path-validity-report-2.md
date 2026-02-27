# Mountd adapter path validity report (local vs global)

Generated: 2026-02-25

This report verifies Mountd's **skill install** paths against the published agent path mappings in `vercel-labs/skills` (commit `b248cdf08f647faf8b7a00e4d89344d9b83ab0e1`).

Notes:
- This mapping is for **skills**. Mountd's **workflow** paths are a Mountd convention and are not covered by that table.
- `~` means the current user's home directory (`os.homedir()`).

## Verified skill paths

| Adapter (Mountd) | Local skill path (project) | Global skill path (`--global`) | Status | Validity notes | Vercel source | Tool-doc source |
|---|---|---|---|---|---|---|
| `antigravity` | `.agent/skills/<skill>/` | `~/.gemini/antigravity/skills/<skill>/` | Verified | Matches Vercel mapping; individual public docs for Antigravity filesystem paths are limited. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | No clear official path doc found (public) |
| `gemini` | `.agents/skills/<skill>/` | `~/.gemini/skills/<skill>/` | Verified | Valid for skills compatibility mapping; Gemini native docs often focus on instructions/rules behavior. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions |
| `cursor` | `.agents/skills/<skill>/` | `~/.cursor/skills/<skill>/` | Verified | Valid for skills compatibility mapping; differs from native Cursor rules docs. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://docs.cursor.com/context/rules |
| `copilot` | `.agents/skills/<skill>/` | `~/.copilot/skills/<skill>/` | Verified | Valid for skills compatibility mapping; native Copilot model is instruction-file based. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions |
| `opencode` | `.agents/skills/<skill>/` | `~/.config/opencode/skills/<skill>/` | Verified | Matches skills mapping; OpenCode docs also mention compatibility path behavior. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://opencode.ai/docs/skills |
| `claude` | `.claude/skills/<skill>/` | `~/.claude/skills/<skill>/` | Verified | Matches Vercel mapping and aligns with Claude Code docs. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://docs.anthropic.com/en/docs/claude-code |
| `kilocode` | `.kilocode/skills/<skill>/` | `~/.kilocode/skills/<skill>/` | Verified | Matches Vercel mapping; Kilo docs describe rules/workflow behavior and global config locations. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://kilocode.ai/docs/advanced-usage/global-rules |
| `cline` | `.cline/skills/<skill>/` | `~/.cline/skills/<skill>/` | Verified | Matches Vercel mapping; Cline docs focus on instruction/rules patterns. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://docs.cline.bot/improving-your-prompting-skills/prompting/custom-instructions |
| `roocode` | `.roo/skills/<skill>/` | `~/.roo/skills/<skill>/` | Verified | Matches Vercel mapping; public official filesystem doc is limited. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | No clear official path doc found (public) |
| `trae` | `.trae/skills/<skill>/` | `~/.trae/skills/<skill>/` | Verified | Matches Vercel mapping; public official filesystem doc is limited. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | No clear official path doc found (public) |
| `windsurf` | `.windsurf/skills/<skill>/` | `~/.codeium/windsurf/skills/<skill>/` | Verified | Valid for skills compatibility mapping; differs from Windsurf native memory/rules docs. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | https://docs.windsurf.com/windsurf/cascade/memories |
| `generic` | `.agents/skills/<skill>/` | `~/.config/agents/skills/<skill>/` | Verified | Generic fallback convention from Vercel mapping, not vendor-specific. | https://github.com/vercel-labs/skills/blob/b248cdf08f647faf8b7a00e4d89344d9b83ab0e1/README.md | N/A (generic fallback) |

## Workflow paths (unverified)

Mountd still supports workflows for backward compatibility, but workflow paths are not covered by the Vercel skills mapping. Treat workflow targets as implementation-specific and legacy.
