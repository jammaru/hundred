import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
  timeoutMs: number;
  webRoot: string | undefined;
}

const loadDotEnv = (): void => {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) {
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
    maxConcurrency: numberEnv('JEV_MAX_CONCURRENCY', 8),
    maxQps: numberEnv('JEV_MAX_QPS', 10),
    timeoutMs: numberEnv('JEV_TIMEOUT_MS', 3000),
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
  return config.jevApiKey ? 'jev' : 'rules';
};
