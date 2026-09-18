import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const forbidden: Record<string, { folder: string; banned: string[] }> = {
  '@hundred/domain': {
    folder: 'packages/domain',
    banned: ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk', 'zustand'],
  },
  '@hundred/simulation': {
    folder: 'packages/simulation',
    banned: ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk'],
  },
  '@hundred/decision': {
    folder: 'packages/decision',
    banned: ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk'],
  },
  '@jev/shogi-engine': {
    folder: 'packages/shogi-engine',
    banned: ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk'],
  },
};

const readDeps = (packagePath: string): string[] => {
  const json = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return [...Object.keys(json.dependencies ?? {}), ...Object.keys(json.devDependencies ?? {})];
};

let failed = false;
for (const [name, { folder, banned }] of Object.entries(forbidden)) {
  const deps = readDeps(join(root, folder, 'package.json'));
  for (const item of banned) {
    if (deps.includes(item)) {
      console.error(`${name} must not depend on ${item}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.info('package boundaries ok');
