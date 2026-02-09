
import fs from 'fs-extra';
import path from 'node:path';
import { ofetch } from 'ofetch';
import AdmZip from 'adm-zip';
import os from 'node:os';
import chalk from 'chalk';

interface GitHubInfo {
    owner: string;
    repo: string;
    type?: 'tree' | 'blob';
    ref?: string;
    path?: string;
}

export interface RegistryItem {
    name: string;
    path: string;
    type: 'skill' | 'workflow' | 'bundle';
    description?: string;
    includes?: string[];
}

interface Registry {
    name?: string;
    description?: string;
    items: RegistryItem[];
}

export async function parseRegistryJson(repoRoot: string): Promise<RegistryItem[]> {
    const registryPath = path.join(repoRoot, 'registry.json');

    if (!await fs.pathExists(registryPath)) {
        throw new Error('No registry.json found. This repository is not a Mountd registry.');
    }

    const content = await fs.readFile(registryPath, 'utf-8');
    const registry: Registry = JSON.parse(content);

    if (!registry.items || !Array.isArray(registry.items)) {
        throw new Error('Invalid registry.json: missing or invalid "items" array.');
    }

    return registry.items;
}

export async function downloadFile(url: string, dest: string): Promise<void> {
    const response = await ofetch(url, { responseType: 'arrayBuffer' });
    await fs.outputFile(dest, Buffer.from(response));
}

export async function downloadAndExtractZip(url: string, destDir: string): Promise<void> {
    const response = await ofetch(url, { responseType: 'arrayBuffer' });
    const zip = new AdmZip(Buffer.from(response));
    zip.extractAllTo(destDir, true);
}

export function parseGitHubUrl(url: string): GitHubInfo | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/(tree|blob)\/([^\/]+)(?:\/(.*))?)?/);
    if (!match) return null;

    const [, owner, repo, type, ref, filePath] = match;
    if (!owner || !repo) return null;

    return {
        owner,
        repo: repo.replace('.git', ''),
        type: type as 'tree' | 'blob' | undefined,
        ref,
        path: filePath
    };
}

export function getGitHubRawUrl(info: GitHubInfo): string {
    const ref = info.ref || 'HEAD';
    return `https://raw.githubusercontent.com/${info.owner}/${info.repo}/${ref}/${info.path || ''}`;
}

/**
 * Downloads a GitHub repo/tree to a temporary directory.
 * Returns the path to the extracted root directory (e.g. /tmp/mountd-123/repo-main).
 * IMPORTANT: Caller is responsible for cleaning up the parent of the returned path!
 * (The returned path is inside a temp dir, so you should remove path.dirname(returnedPath))
 */
export async function downloadGitHubRepoZip(info: GitHubInfo): Promise<string> {
    const tmpDir = path.join(os.tmpdir(), `mountd-${Date.now()}`);

    try {
        const ref = info.ref || 'HEAD';
        // GitHub zipball URL
        // If ref is provided (branch/tag/sha), use it.
        // If path is provided (tree), we still download the whole repo zip for that ref.
        const zipUrl = `https://github.com/${info.owner}/${info.repo}/archive/${ref}.zip`;

        // console.log(chalk.gray(`Downloading archive from ${zipUrl}...`));
        await downloadAndExtractZip(zipUrl, tmpDir);

        // Find the extracted root folder (GitHub zips usually contain one top-level folder)
        const files = await fs.readdir(tmpDir);
        const rootDir = files.find(f => fs.statSync(path.join(tmpDir, f)).isDirectory());

        if (!rootDir) {
            throw new Error(`Empty archive or no root directory found in ${zipUrl}`);
        }

        return path.join(tmpDir, rootDir);
    } catch (error) {
        await fs.remove(tmpDir);
        throw error;
    }
}
