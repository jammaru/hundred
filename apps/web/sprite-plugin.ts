import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';
import type { Plugin } from 'vite';

import { removeMagenta } from './src/world/chroma-key.ts';

/** Decode before browser premultiplication discards RGB under damaged alpha. */
export const spritePlugin = (): Plugin => {
  const directory = new URL('./public/assets/sprites/', import.meta.url);
  const textures = new Map<string, Buffer>();
  return {
    name: 'hundred-sprites',
    buildStart() {
      textures.clear();
      for (const name of readdirSync(directory).filter((file) => file.endsWith('.png'))) {
        const source = new URL(name, directory);
        this.addWatchFile(fileURLToPath(source));
        const png = PNG.sync.read(readFileSync(source));
        removeMagenta(png.data, true);
        let left = png.width;
        let top = png.height;
        let right = -1;
        let bottom = -1;
        for (let y = 0; y < png.height; y += 1) {
          for (let x = 0; x < png.width; x += 1) {
            if (png.data[(y * png.width + x) * 4 + 3]! < 32) continue;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
        if (right < left) throw new Error(`Empty world sprite: ${name}`);
        const trimmed = new PNG({ width: right - left + 3, height: bottom - top + 3 });
        PNG.bitblt(png, trimmed, left, top, right - left + 1, bottom - top + 1, 1, 1);
        textures.set(`/assets/world/${name}`, PNG.sync.write(trimmed));
      }
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const texture = textures.get(request.url?.split('?')[0] ?? '');
        if (!texture) return next();
        response.setHeader('Content-Type', 'image/png');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(texture);
      });
    },
    generateBundle() {
      for (const [path, source] of textures) {
        this.emitFile({ type: 'asset', fileName: path.slice(1), source });
      }
    },
  };
};
