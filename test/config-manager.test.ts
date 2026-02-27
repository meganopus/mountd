import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigManager } from '../src/utils/config';
import { makeTempDir, removeTempDir } from './helpers';

describe('ConfigManager', () => {
  it('load returns null when config missing', async () => {
    const dir = await makeTempDir();
    try {
      const cm = new ConfigManager(dir);
      expect(await cm.load()).toBeNull();
      expect(cm.getConfig()).toBeNull();
    } finally {
      await removeTempDir(dir);
    }
  });

  it('save and load roundtrip', async () => {
    const dir = await makeTempDir();
    try {
      const cm = new ConfigManager(dir);
      await cm.save({ agents: ['cursor'], installed: [] });
      const loaded = await cm.load();
      expect(loaded).toEqual({ agents: ['cursor'], installed: [] });
      expect(cm.getConfig()).toEqual(loaded);

      const raw = await fs.readFile(path.join(dir, '.mountdrc.json'), 'utf8');
      expect(raw).toContain('"agents"');
    } finally {
      await removeTempDir(dir);
    }
  });

  it('update merges updates', async () => {
    const dir = await makeTempDir();
    try {
      const cm = new ConfigManager(dir);
      await cm.save({ agents: ['cursor'], installed: [] });
      await cm.update({ agents: ['gemini'] });
      const loaded = await cm.load();
      expect(loaded).toEqual({ agents: ['gemini'], installed: [] });
    } finally {
      await removeTempDir(dir);
    }
  });

  it('addInstalledSkill upserts by name', async () => {
    const dir = await makeTempDir();
    try {
      const cm = new ConfigManager(dir);
      await cm.addInstalledSkill({ name: 'a', source: 'x', installedAt: new Date(0).toISOString() });
      await cm.addInstalledSkill({ name: 'a', source: 'y', installedAt: new Date(1).toISOString() });
      const loaded = await cm.load();
      expect(loaded?.installed).toHaveLength(1);
      expect(loaded?.installed?.[0]?.source).toBe('y');
    } finally {
      await removeTempDir(dir);
    }
  });

  it('removeInstalledSkill removes and returns boolean', async () => {
    const dir = await makeTempDir();
    try {
      const cm = new ConfigManager(dir);
      await cm.addInstalledSkill({ name: 'a', source: 'x', installedAt: new Date(0).toISOString() });
      expect(await cm.removeInstalledSkill('missing')).toBe(false);
      expect(await cm.removeInstalledSkill('a')).toBe(true);
      const loaded = await cm.load();
      expect(loaded?.installed).toEqual([]);
    } finally {
      await removeTempDir(dir);
    }
  });
});
