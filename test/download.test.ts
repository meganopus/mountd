import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getGitHubRawUrl, parseGitHubUrl, parseRegistryJson } from '../src/utils/download';
import { makeTempDir, removeTempDir } from './helpers';

describe('download utils', () => {
  it('parseGitHubUrl parses owner/repo root URL', () => {
    const info = parseGitHubUrl('https://github.com/meganopus/pdlc');
    expect(info).toBeTruthy();
    expect(info!.owner).toBe('meganopus');
    expect(info!.repo).toBe('pdlc');
    expect(info!.type).toBeUndefined();
  });

  it('parseGitHubUrl parses tree and blob URLs', () => {
    const tree = parseGitHubUrl('https://github.com/u/r/tree/main/path/to/dir');
    expect(tree).toBeTruthy();
    expect(tree!.owner).toBe('u');
    expect(tree!.repo).toBe('r');
    expect(tree!.type).toBe('tree');
    expect(tree!.ref).toBe('main');
    expect(tree!.path).toBe('path/to/dir');

    const blob = parseGitHubUrl('https://github.com/u/r/blob/dev/README.md');
    expect(blob).toBeTruthy();
    expect(blob!.type).toBe('blob');
    expect(blob!.ref).toBe('dev');
    expect(blob!.path).toBe('README.md');
  });

  it('parseGitHubUrl strips .git suffix', () => {
    const info = parseGitHubUrl('https://github.com/u/r.git');
    expect(info).toBeTruthy();
    expect(info!.repo).toBe('r');
  });

  it('getGitHubRawUrl builds raw URL with default ref', () => {
    const info = parseGitHubUrl('https://github.com/u/r/blob/main/skill.md');
    expect(info).toBeTruthy();
    expect(getGitHubRawUrl(info!)).toBe('https://raw.githubusercontent.com/u/r/main/skill.md');
  });

  it('parseRegistryJson reads and validates registry.json', async () => {
    const dir = await makeTempDir();
    try {
      await fs.writeFile(
        path.join(dir, 'registry.json'),
        JSON.stringify({ items: [{ name: 'a', path: 'a', type: 'skill' }] }, null, 2),
        'utf8'
      );
      const items = await parseRegistryJson(dir);
      expect(items).toHaveLength(1);
      expect(items[0]?.name).toBe('a');
    } finally {
      await removeTempDir(dir);
    }
  });

  it('parseRegistryJson errors when registry.json missing', async () => {
    const dir = await makeTempDir();
    try {
      await expect(parseRegistryJson(dir)).rejects.toThrow(/No registry\.json found/);
    } finally {
      await removeTempDir(dir);
    }
  });

  it('parseRegistryJson errors when items is not an array', async () => {
    const dir = await makeTempDir();
    try {
      await fs.writeFile(path.join(dir, 'registry.json'), JSON.stringify({ items: {} }), 'utf8');
      await expect(parseRegistryJson(dir)).rejects.toThrow(/Invalid registry\.json/);
    } finally {
      await removeTempDir(dir);
    }
  });
});
