import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

const loadRootEnv = (): Record<string, string> => {
  const path = resolve(import.meta.dirname, '../../.env');
  if (!existsSync(path)) {
    return {};
  }
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index <= 0) {
      continue;
    }
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return env;
};

export default defineConfig({
  test: {
    include: ['src/**/*.live.test.ts'],
    env: loadRootEnv(),
  },
});
