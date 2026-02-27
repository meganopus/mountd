import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AgentAdapter } from '../src/adapters/base';
import { installLocalSkill } from '../src/utils/file-ops';
import { makeTempDir, removeTempDir } from './helpers';

function makeFakeAdapter(paths: {
  skillPath: string;
  workflowPath?: string;
  globalSkillPath?: string;
  globalWorkflowPath?: string;
  supportsGlobalInstall?: boolean;
}): AgentAdapter {
  return {
    name: 'fake',
    displayName: 'Fake Adapter',
    supportsGlobalInstall: paths.supportsGlobalInstall ?? true,
    detect: async () => true,
    getSkillPath: () => paths.skillPath,
    getWorkflowPath: () => paths.workflowPath ?? paths.skillPath,
    getGlobalSkillPath: () => paths.globalSkillPath ?? paths.skillPath,
    getGlobalWorkflowPath: () => paths.globalWorkflowPath ?? paths.workflowPath ?? paths.skillPath,
  };
}

describe('installLocalSkill', () => {
  it('converts markdown to Cursor .mdc when target is a file', async () => {
    const dir = await makeTempDir();
    try {
      const sourceFile = path.join(dir, 'my-skill.md');
      await fs.writeFile(sourceFile, '# Hello\n\nWorld\n', 'utf8');

      const targetFile = path.join(dir, 'rules', 'my-skill.mdc');
      const adapter = makeFakeAdapter({ skillPath: targetFile });

      await installLocalSkill(sourceFile, { force: true }, 'local://my-skill.md', [adapter], 'workflow', dir);

      const out = await fs.readFile(targetFile, 'utf8');
      expect(out.startsWith('---\n')).toBe(true);
      expect(out).toContain('description: Installed by mountd: my-skillmd');
      expect(out).toContain('# Hello');

      const configRaw = await fs.readFile(path.join(dir, '.mountdrc.json'), 'utf8');
      const config = JSON.parse(configRaw);
      expect(config.installed).toHaveLength(1);
      expect(config.installed[0].name).toBe('my-skill.md');
      expect(config.installed[0].type).toBe('skill');
      expect(config.installed[0].legacyType).toBe('workflow');
      expect(config.installed[0].source).toBe('local://my-skill.md');
    } finally {
      await removeTempDir(dir);
    }
  });

  it('reads SKILL.md from a directory when target is .mdc', async () => {
    const dir = await makeTempDir();
    try {
      const skillDir = path.join(dir, 'my-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), 'Do the thing.\n', 'utf8');

      const targetFile = path.join(dir, 'rules', 'my-skill.mdc');
      const adapter = makeFakeAdapter({ skillPath: targetFile });

      await installLocalSkill(skillDir, { force: true }, 'local://my-skill', [adapter], 'skill', dir);
      const out = await fs.readFile(targetFile, 'utf8');
      expect(out).toContain('Do the thing.');
    } finally {
      await removeTempDir(dir);
    }
  });

  it('skips overwrite when target exists and --force not set', async () => {
    const dir = await makeTempDir();
    try {
      const sourceDir = path.join(dir, 'skill');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), 'new\n', 'utf8');

      const targetDir = path.join(dir, 'installed', 'skill');
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, 'SKILL.md'), 'old\n', 'utf8');

      const adapter = makeFakeAdapter({ skillPath: targetDir });
      await installLocalSkill(sourceDir, { force: false }, 'local://skill', [adapter], 'skill', dir);

      const out = await fs.readFile(path.join(targetDir, 'SKILL.md'), 'utf8');
      expect(out).toBe('old\n');
    } finally {
      await removeTempDir(dir);
    }
  });
});
