import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ShogiConfig {
  host: string;
  port: number;
  providerMode: 'rules' | 'jev';
  jevApiKey: string | undefined;
  timeoutMs: number;
}

const applyEnvFile = (path: string): void => {
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index <= 0) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const loadDotEnv = (): void => {
  const candidates: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    candidates.push(resolve(dir, '.env'));
    const parent = resolve(dir, '..');
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  candidates.push(resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'));
  const path = candidates.find((item) => existsSync(item));
  if (path) {
    applyEnvFile(path);
  }
};

export const loadConfig = (): ShogiConfig => {
  loadDotEnv();
  const jevApiKey = process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY || undefined;
  const raw = process.env.SHOGI_PROVIDER;
  const mode = raw === 'rules' ? 'rules' : jevApiKey ? 'jev' : 'rules';
  return {
    host: process.env.HOST || '127.0.0.1',
    port: Number(process.env.SHOGI_PORT) || 8788,
    providerMode: mode,
    jevApiKey,
    timeoutMs: Number(process.env.SHOGI_JEV_TIMEOUT_MS) || 8000,
  };
};
