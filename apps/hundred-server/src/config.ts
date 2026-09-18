import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ServerConfig {
  host: string;
  port: number;
  providerMode: 'auto' | 'rules' | 'jev' | 'replay';
  jevApiKey: string | undefined;
  worldSeed: number;
  recordRun: boolean;
  replayPath: string | undefined;
  maxConcurrency: number;
  maxQps: number;
  batchSize: number;
  timeoutMs: number;
  webRoot: string | undefined;
}

const envFileCandidates = (): string[] => {
  const paths: string[] = [];
  const add = (path: string): void => {
    if (!paths.includes(path)) {
      paths.push(path);
    }
  };
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    add(resolve(dir, '.env'));
    const parent = resolve(dir, '..');
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  add(resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'));
  return paths;
};

const loadDotEnv = (): void => {
  const path = envFileCandidates().find((candidate) => existsSync(candidate));
  if (!path) {
    return;
  }
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
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

const numberEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

export const loadConfig = (): ServerConfig => {
  loadDotEnv();
  const mode = process.env.DECISION_PROVIDER;
  const providerMode =
    mode === 'rules' || mode === 'jev' || mode === 'replay' || mode === 'auto' ? mode : 'auto';
  const seedRaw = process.env.WORLD_SEED;
  const worldSeed =
    seedRaw && Number.isFinite(Number(seedRaw)) ? Number(seedRaw) : Date.now() % 1_000_000;
  const jevApiKey = process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY || undefined;
  return {
    host: process.env.HOST || '127.0.0.1',
    port: numberEnv('PORT', 8787),
    providerMode,
    jevApiKey: jevApiKey || undefined,
    worldSeed,
    recordRun: process.env.RECORD_RUN !== 'false',
    replayPath: process.env.REPLAY_PATH || undefined,
    maxConcurrency: numberEnv('JEV_MAX_CONCURRENCY', 2),
    maxQps: numberEnv('JEV_MAX_QPS', 4),
    batchSize: numberEnv('JEV_BATCH_SIZE', 8),
    timeoutMs: numberEnv('JEV_TIMEOUT_MS', 4000),
    webRoot: process.env.WEB_ROOT,
  };
};

export const resolveProviderId = (config: ServerConfig): 'jev' | 'rules' | 'replay' => {
  if (config.providerMode === 'replay' || config.replayPath) {
    return 'replay';
  }
  if (config.providerMode === 'rules') {
    return 'rules';
  }
  if (config.providerMode === 'jev') {
    return config.jevApiKey ? 'jev' : 'rules';
  }
  return 'rules';
};
