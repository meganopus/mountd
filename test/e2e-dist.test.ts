import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { makeTempDir, removeTempDir } from './helpers';

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function homeEnv(homeDir: string): Record<string, string> {
  const env: Record<string, string> = {
    HOME: homeDir,
    USERPROFILE: homeDir,
    NO_COLOR: '1',
    FORCE_COLOR: '0',
    CI: '1',
  };

  if (process.platform === 'win32') {
    env.HOMEDRIVE = path.parse(homeDir).root.replace(/\\$/, '');
    env.HOMEPATH = homeDir.slice(env.HOMEDRIVE.length) || '\\';
  }

  return env;
}

async function runNodeDist(
  args: string[],
  options?: { cwd?: string; homeDir?: string }
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(process.cwd(), 'dist', 'index.js'), ...args], {
      cwd: options?.cwd ?? process.cwd(),
      env: {
        ...process.env,
        ...(options?.homeDir ? homeEnv(options.homeDir) : {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('error', reject);
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

describe('e2e (dist)', () => {
  it('dist exists', async () => {
    expect(await fileExists(path.join(process.cwd(), 'dist', 'index.js'))).toBe(true);
  });

  it('dist --help includes core commands', async (ctx) => {
    try {
      const { code, stdout, stderr } = await runNodeDist(['--help']);
      expect(code).toBe(0);
      expect(stdout + stderr).toMatch(/AI Agent Skill\/Workflow Distribution CLI|mountd/i);
      expect(stdout + stderr).toMatch(/\blist\b/i);
      expect(stdout + stderr).toMatch(/\bremove\b/i);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    }
  });

  it('dist --version matches package.json', async (ctx) => {
    try {
      const pkgRaw = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8');
      const pkg = JSON.parse(pkgRaw) as { version?: string };
      expect(pkg.version).toBeTruthy();

      const { code, stdout, stderr } = await runNodeDist(['--version']);
      expect(code).toBe(0);
      expect(stderr).toBe('');
      expect(stdout.trim()).toBe(pkg.version);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    }
  });

  it('no-arg run with no config does not crash (reinstall path)', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      const { code, stdout, stderr } = await runNodeDist([], { cwd: projectDir, homeDir: projectDir });
      expect(code).toBe(0);
      expect(stdout + stderr).toMatch(/No installed skills found/i);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
    }
  });

  it('list shows empty state when no config', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      const { code, stdout, stderr } = await runNodeDist(['list'], { cwd: projectDir, homeDir: projectDir });
      expect(code).toBe(0);
      expect(stdout + stderr).toMatch(/No skills installed yet/i);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
    }
  });

  it('list prints installed items including legacy workflow marker', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      const config = {
        agents: ['generic'],
        installed: [
          {
            name: 'a',
            source: 'local://a',
            type: 'skill',
            installedAt: new Date(0).toISOString(),
          },
          {
            name: 'b',
            source: 'local://b',
            type: 'skill',
            legacyType: 'workflow',
            installedAt: new Date(1).toISOString(),
          },
        ],
      };
      await fs.writeFile(path.join(projectDir, '.mountdrc.json'), JSON.stringify(config, null, 2), 'utf8');

      const { code, stdout, stderr } = await runNodeDist(['list'], { cwd: projectDir, homeDir: projectDir });
      expect(code).toBe(0);
      const out = stdout + stderr;
      expect(out).toMatch(/Installed Items/i);
      expect(out).toMatch(/\bConfigured Agents:\s*generic\b/i);
      expect(out).toMatch(/- .*a.*\[skill\]/i);
      expect(out).toMatch(/- .*b.*\[skill\].*\(legacy workflow\)/i);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
    }
  });

  it('remove returns a friendly error when item missing', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      await fs.writeFile(path.join(projectDir, '.mountdrc.json'), JSON.stringify({ agents: ['generic'], installed: [] }, null, 2), 'utf8');
      const { code, stdout, stderr } = await runNodeDist(['remove', 'nope'], { cwd: projectDir, homeDir: projectDir });
      expect(code).toBe(0);
      expect(stdout + stderr).toMatch(/not found/i);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
    }
  });

  it('remove deletes project skill directory and updates config', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      await fs.mkdir(path.join(projectDir, '.agents', 'skills', 'demo'), { recursive: true });
      await fs.writeFile(path.join(projectDir, '.agents', 'skills', 'demo', 'SKILL.md'), 'hi\n', 'utf8');

      await fs.writeFile(
        path.join(projectDir, '.mountdrc.json'),
        JSON.stringify(
          {
            agents: ['generic'],
            installed: [{ name: 'demo', source: 'local://demo', type: 'skill', installedAt: new Date().toISOString() }],
          },
          null,
          2
        ),
        'utf8'
      );

      const { code } = await runNodeDist(['remove', 'demo'], { cwd: projectDir, homeDir: projectDir });
      expect(code).toBe(0);
      expect(await fileExists(path.join(projectDir, '.agents', 'skills', 'demo'))).toBe(false);

      const updated = JSON.parse(await fs.readFile(path.join(projectDir, '.mountdrc.json'), 'utf8'));
      expect(updated.installed).toEqual([]);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
    }
  });

  it('remove also deletes legacy workflow path when record is legacy workflow', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      await fs.mkdir(path.join(projectDir, '.agents', 'skills', 'legacy'), { recursive: true });
      await fs.mkdir(path.join(projectDir, '.agents', 'workflows', 'legacy'), { recursive: true });

      await fs.writeFile(
        path.join(projectDir, '.mountdrc.json'),
        JSON.stringify(
          {
            agents: ['generic'],
            installed: [
              { name: 'legacy', source: 'local://legacy', type: 'skill', legacyType: 'workflow', installedAt: new Date().toISOString() },
            ],
          },
          null,
          2
        ),
        'utf8'
      );

      const { code } = await runNodeDist(['remove', 'legacy'], { cwd: projectDir, homeDir: projectDir });
      expect(code).toBe(0);
      expect(await fileExists(path.join(projectDir, '.agents', 'skills', 'legacy'))).toBe(false);
      expect(await fileExists(path.join(projectDir, '.agents', 'workflows', 'legacy'))).toBe(false);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
    }
  });

  it('remove --global uses homeDir paths (GenericAdapter) and updates global config', async (ctx) => {
    const homeDir = await makeTempDir('mountd-e2e-home-');
    const projectDir = await makeTempDir('mountd-e2e-project-');
    try {
      const globalSkillDir = path.join(homeDir, '.config', 'agents', 'skills', 'g');
      await fs.mkdir(globalSkillDir, { recursive: true });
      await fs.writeFile(path.join(globalSkillDir, 'SKILL.md'), 'global\n', 'utf8');

      await fs.writeFile(
        path.join(homeDir, '.mountdrc.json'),
        JSON.stringify(
          {
            agents: ['generic'],
            installed: [{ name: 'g', source: 'local://g', type: 'skill', installedAt: new Date().toISOString() }],
          },
          null,
          2
        ),
        'utf8'
      );

      const { code } = await runNodeDist(['remove', 'g', '--global'], { cwd: projectDir, homeDir });
      expect(code).toBe(0);
      expect(await fileExists(globalSkillDir)).toBe(false);

      const updated = JSON.parse(await fs.readFile(path.join(homeDir, '.mountdrc.json'), 'utf8'));
      expect(updated.installed).toEqual([]);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(projectDir);
      await removeTempDir(homeDir);
    }
  });

  it('install local skill into Claude adapter path via --agents/--no-prompt', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    const skillDir = await makeTempDir('mountd-e2e-skill-');
    try {
      await fs.mkdir(path.join(skillDir, 'demo-skill'), { recursive: true });
      await fs.writeFile(path.join(skillDir, 'demo-skill', 'SKILL.md'), 'Hello Claude\n', 'utf8');

      const { code, stdout, stderr } = await runNodeDist(
        [path.join(skillDir, 'demo-skill'), '--agents', 'claude', '--no-prompt'],
        { cwd: projectDir, homeDir: projectDir }
      );
      expect(code).toBe(0);
      expect(stdout + stderr).toMatch(/Successfully installed/i);

      const installed = path.join(projectDir, '.claude', 'skills', 'demo-skill', 'SKILL.md');
      expect(await fileExists(installed)).toBe(true);

      const config = JSON.parse(await fs.readFile(path.join(projectDir, '.mountdrc.json'), 'utf8'));
      expect(config.agents).toEqual(['claude']);
      expect(config.installed?.some((s: any) => s.name === 'demo-skill')).toBe(true);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(skillDir);
      await removeTempDir(projectDir);
    }
  });

  it('install from local registry: single skill item', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    const registryDir = await makeTempDir('mountd-e2e-registry-');
    try {
      await fs.mkdir(path.join(registryDir, 'skills', 'a'), { recursive: true });
      await fs.writeFile(path.join(registryDir, 'skills', 'a', 'SKILL.md'), 'A\n', 'utf8');

      await fs.writeFile(
        path.join(registryDir, 'registry.json'),
        JSON.stringify(
          {
            items: [
              { name: 'a', path: 'skills/a', type: 'skill', description: 'Skill A' },
            ],
          },
          null,
          2
        ),
        'utf8'
      );

      const { code, stdout, stderr } = await runNodeDist(
        [registryDir, 'a', '--agents', 'claude', '--no-prompt'],
        { cwd: projectDir, homeDir: projectDir }
      );
      expect(code).toBe(0);
      expect(await fileExists(path.join(projectDir, '.claude', 'skills', 'a', 'SKILL.md'))).toBe(true);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(registryDir);
      await removeTempDir(projectDir);
    }
  });

  it('install from local registry: bundle installs all included items (deduped)', async (ctx) => {
    const projectDir = await makeTempDir('mountd-e2e-project-');
    const registryDir = await makeTempDir('mountd-e2e-registry-');
    try {
      await fs.mkdir(path.join(registryDir, 'skills', 'a'), { recursive: true });
      await fs.mkdir(path.join(registryDir, 'skills', 'b'), { recursive: true });
      await fs.writeFile(path.join(registryDir, 'skills', 'a', 'SKILL.md'), 'A\n', 'utf8');
      await fs.writeFile(path.join(registryDir, 'skills', 'b', 'SKILL.md'), 'B\n', 'utf8');

      await fs.writeFile(
        path.join(registryDir, 'registry.json'),
        JSON.stringify(
          {
            items: [
              { name: 'a', path: 'skills/a', type: 'skill' },
              { name: 'b', path: 'skills/b', type: 'skill' },
              { name: 'bundle', path: '.', type: 'bundle', includes: ['a', 'b', 'a'] },
            ],
          },
          null,
          2
        ),
        'utf8'
      );

      const { code, stdout, stderr } = await runNodeDist(
        [registryDir, 'bundle', '--agents', 'claude', '--no-prompt'],
        { cwd: projectDir, homeDir: projectDir }
      );
      expect(code).toBe(0);
      expect(await fileExists(path.join(projectDir, '.claude', 'skills', 'a', 'SKILL.md'))).toBe(true);
      expect(await fileExists(path.join(projectDir, '.claude', 'skills', 'b', 'SKILL.md'))).toBe(true);
    } catch (err: any) {
      if (err?.code === 'EPERM') {
        ctx.skip();
        return;
      }
      throw err;
    } finally {
      await removeTempDir(registryDir);
      await removeTempDir(projectDir);
    }
  });
});
