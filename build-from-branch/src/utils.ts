import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'path';
import { exec } from 'child_process';
import { LOCAL_CONFIG_PATH } from './constants.js';

interface Config {
    name?: string;
}

interface GitState {
    remote: string;
    branch: string;
    rootPath: string;
}

export const loadActorConfigOrThrow = (): Config => {
    const configPath = join(process.cwd(), LOCAL_CONFIG_PATH);
    if (!existsSync(configPath)) {
        throw new Error('Actor configuration not found');
    }

    const file = readFileSync(configPath, 'utf-8');
    try {
        return JSON.parse(file) as Config;
    } catch (e) {
        throw new Error(`Failed to parse actor configuration. Error: ${e}`);
    }
};

export const getCurrentGitStateOrThrow = async (): Promise<GitState> => {
    const remote = await new Promise((resolve) => {
        exec('git config --get remote.origin.url', (_err, stdout) => {
            resolve(stdout.trim());
        });
    }) as string;

    const branch = await new Promise((resolve) => {
        exec('git branch --show-current', (_err, stdout) => {
            resolve(stdout.trim());
        });
    }) as string;

    const rootPath = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', (_err, stdout) => {
            resolve(stdout.trim());
        });
    }) as string;

    if (!remote || !branch || !rootPath) {
        throw new Error('Failed to get the git state');
    }

    return { remote, branch, rootPath };
};

export const getCurrentFolder = (rootPath: string): string => {
    return relative(rootPath.trim(), process.cwd());
};

export const createGitRepoUrl = (remote: string, branch: string, path: string): string => {
    return `${remote}#${branch}:${path}`;
};
