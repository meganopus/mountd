import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function makeTempDir(prefix = 'mountd-test-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function removeTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

