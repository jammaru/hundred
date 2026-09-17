// Sprite preparation: chroma-key a solid magenta background, despill edges,
// trim transparent margins, and optionally downscale.
//
// Usage:
//   node scripts/sprite-key.mjs <in.png> <out.png> [--max <px>] [--shadow] [--pad <px>]
//
// --shadow  Also flood-fill neutral gray baked-in shadows surrounding the subject.
// --max     Downscale so the longest side is at most this many pixels (bilinear).
// --pad     Transparent padding kept around the trimmed subject (default 2).

import { readFileSync, writeFileSync } from 'node:fs';

import { PNG } from 'pngjs';

const [input, output, ...rest] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    'usage: node scripts/sprite-key.mjs <in.png> <out.png> [--max px] [--shadow] [--pad px]',
  );
  process.exit(1);
}
const flag = (name) => rest.includes(name);
const option = (name, fallback) => {
  const index = rest.indexOf(name);
  return index >= 0 ? Number(rest[index + 1]) : fallback;
};
const maxSize = option('--max', 0);
const pad = option('--pad', 2);
const eatShadow = flag('--shadow');

const png = PNG.sync.read(readFileSync(input));
const { width, height, data } = png;

const at = (x, y) => (y * width + x) * 4;

const isMagenta = (r, g, b) => r > 140 && b > 140 && g < r * 0.72 && g < b * 0.72;
const isShadow = (r, g, b) => {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  return hi - lo < 34 && (r + g + b) / 3 < 195;
};
const isBackground = (r, g, b) => isMagenta(r, g, b) || (eatShadow && isShadow(r, g, b));

// Flood fill from the borders so enclosed details (doors, windows) survive.
const background = new Uint8Array(width * height);
const queue = [];
const push = (x, y) => {
  const index = y * width + x;
  if (background[index]) return;
  const offset = index * 4;
  if (!isBackground(data[offset], data[offset + 1], data[offset + 2])) return;
  background[index] = 1;
  queue.push(index);
};
for (let x = 0; x < width; x += 1) {
  push(x, 0);
  push(x, height - 1);
}
for (let y = 0; y < height; y += 1) {
  push(0, y);
  push(width - 1, y);
}
while (queue.length > 0) {
  const index = queue.pop();
  const x = index % width;
  const y = Math.floor(index / width);
  if (x > 0) push(x - 1, y);
  if (x < width - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < height - 1) push(x, y + 1);
}

// Key out background, despill magenta fringe, soften the cut edge by one pixel.
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const index = y * width + x;
    const offset = index * 4;
    if (background[index]) {
      data[offset + 3] = 0;
      continue;
    }
    let r = data[offset];
    let g = data[offset + 1];
    let b = data[offset + 2];
    if (r > g + 40 && b > g + 40) {
      const target = Math.max(g, Math.min(r, b) - 60);
      r = target;
      b = target;
    }
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    const edge =
      (x > 0 && background[index - 1]) ||
      (x < width - 1 && background[index + 1]) ||
      (y > 0 && background[index - width]) ||
      (y < height - 1 && background[index + width]);
    if (edge) {
      data[offset + 3] = Math.min(data[offset + 3], 170);
    }
  }
}

// Trim to the opaque bounding box.
let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (data[at(x, y) + 3] > 8) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
if (maxX < 0) {
  console.error('no subject found after keying');
  process.exit(1);
}
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);
let outW = maxX - minX + 1;
let outH = maxY - minY + 1;
const cropped = new PNG({ width: outW, height: outH });
for (let y = 0; y < outH; y += 1) {
  for (let x = 0; x < outW; x += 1) {
    const from = at(minX + x, minY + y);
    const to = (y * outW + x) * 4;
    cropped.data[to] = data[from];
    cropped.data[to + 1] = data[from + 1];
    cropped.data[to + 2] = data[from + 2];
    cropped.data[to + 3] = data[from + 3];
  }
}

// Optional bilinear downscale.
let result = cropped;
if (maxSize > 0 && Math.max(outW, outH) > maxSize) {
  const scale = maxSize / Math.max(outW, outH);
  const dstW = Math.max(1, Math.round(outW * scale));
  const dstH = Math.max(1, Math.round(outH * scale));
  const scaled = new PNG({ width: dstW, height: dstH });
  for (let y = 0; y < dstH; y += 1) {
    for (let x = 0; x < dstW; x += 1) {
      const srcX = (x + 0.5) / scale - 0.5;
      const srcY = (y + 0.5) / scale - 0.5;
      const x0 = Math.max(0, Math.floor(srcX));
      const y0 = Math.max(0, Math.floor(srcY));
      const x1 = Math.min(outW - 1, x0 + 1);
      const y1 = Math.min(outH - 1, y0 + 1);
      const fx = Math.min(1, Math.max(0, srcX - x0));
      const fy = Math.min(1, Math.max(0, srcY - y0));
      const to = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c += 1) {
        const p00 = cropped.data[(y0 * outW + x0) * 4 + c];
        const p10 = cropped.data[(y0 * outW + x1) * 4 + c];
        const p01 = cropped.data[(y1 * outW + x0) * 4 + c];
        const p11 = cropped.data[(y1 * outW + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bottom = p01 + (p11 - p01) * fx;
        scaled.data[to + c] = Math.round(top + (bottom - top) * fy);
      }
    }
  }
  result = scaled;
}

writeFileSync(output, PNG.sync.write(result));
console.log(`${output}: ${result.width}x${result.height}`);
