import path from 'node:path';
import fs from 'fs-extra';
import { type FlowerConfig } from '../types';

export class ConfigManager {
    private configPath: string;
    private config: FlowerConfig | null = null;

    constructor(cwd: string = process.cwd()) {
        this.configPath = path.join(cwd, '.mountdrc.json');
    }

    async load(): Promise<FlowerConfig | null> {
        if (await fs.pathExists(this.configPath)) {
            try {
                this.config = await fs.readJson(this.configPath);
                return this.config;
            } catch (error) {
                console.warn('Failed to read config file:', error);
                return null;
            }
        }
        return null;
    }

    async save(config: FlowerConfig): Promise<void> {
        this.config = config;
        await fs.writeJson(this.configPath, config, { spaces: 2 });
    }

    getConfig(): FlowerConfig | null {
        return this.config;
    }

    async update(updates: Partial<FlowerConfig>): Promise<void> {
        const current = await this.load() || {};
        const newConfig = { ...current, ...updates };
        await this.save(newConfig);
    }

    async addInstalledSkill(skill: { name: string; source: string; version?: string; type?: 'skill' | 'workflow'; installedAt: string; }): Promise<void> {
        const current = await this.load() || {};
        const installed = current.installed || [];
        // Remove existing if any (update)
        const filtered = installed.filter(s => s.name !== skill.name);
        filtered.push(skill);
        await this.save({ ...current, installed: filtered });
    }

    async removeInstalledSkill(skillName: string): Promise<boolean> {
        const current = await this.load();
        if (!current || !current.installed) return false;

        const initialLength = current.installed.length;
        const filtered = current.installed.filter(s => s.name !== skillName);

        if (filtered.length !== initialLength) {
            await this.save({ ...current, installed: filtered });
            return true;
        }
        return false;
    }
}
