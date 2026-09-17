import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const forbidden: Record<string, string[]> = {
  '@hundred/domain': ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk', 'zustand'],
  '@hundred/simulation': ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk'],
  '@hundred/decision': ['react', 'pixi.js', 'hono', '@typesafe-ai/sdk'],
};

const readDeps = (packagePath: string): string[] => {
  const json = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return [...Object.keys(json.dependencies ?? {}), ...Object.keys(json.devDependencies ?? {})];
};

let failed = false;
for (const [name, banned] of Object.entries(forbidden)) {
  const folder = name.replace('@hundred/', '');
  const deps = readDeps(join(root, 'packages', folder, 'package.json'));
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
