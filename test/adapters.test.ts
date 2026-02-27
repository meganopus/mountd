import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CursorAdapter } from '../src/adapters/cursor';
import { CodexAdapter, GenericAdapter, getAdapterByName } from '../src/adapters';
import { makeTempDir, removeTempDir } from './helpers';

describe('adapters', () => {
  it('CursorAdapter.detect detects .cursor dir', async () => {
    const dir = await makeTempDir();
    try {
      await fs.mkdir(path.join(dir, '.cursor'), { recursive: true });
      const adapter = new CursorAdapter();
      expect(await adapter.detect(dir)).toBe(true);
    } finally {
      await removeTempDir(dir);
    }
  });

  it('CursorAdapter.detect detects .cursorrules file', async () => {
    const dir = await makeTempDir();
    try {
      await fs.writeFile(path.join(dir, '.cursorrules'), 'rules', 'utf8');
      const adapter = new CursorAdapter();
      expect(await adapter.detect(dir)).toBe(true);
    } finally {
      await removeTempDir(dir);
    }
  });

  it('GenericAdapter.detect always returns true (fallback)', async () => {
    const dir = await makeTempDir();
    try {
      const adapter = new GenericAdapter();
      expect(await adapter.detect(dir)).toBe(true);
    } finally {
      await removeTempDir(dir);
    }
  });

  it('CodexAdapter.detect detects .agents/skills in repo tree', async () => {
    const dir = await makeTempDir();
    try {
      await fs.mkdir(path.join(dir, '.agents', 'skills'), { recursive: true });
      const adapter = new CodexAdapter();
      expect(await adapter.detect(dir)).toBe(true);
    } finally {
      await removeTempDir(dir);
    }
  });

  it('getAdapterByName returns adapter instance', () => {
    const adapter = getAdapterByName('cursor');
    expect(adapter).toBeTruthy();
    expect(adapter!.name).toBe('cursor');
  });
});
