import { Graphics } from 'pixi.js';

export const scatter = (
  seed: string,
  count: number,
  width: number,
  height: number,
): Array<{ x: number; y: number; n: number }> => {
  const points: Array<{ x: number; y: number; n: number }> = [];
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  for (let index = 0; index < count; index += 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const x = (hash >>> 0) % Math.max(1, width);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const y = (hash >>> 0) % Math.max(1, height);
    points.push({ x, y, n: hash >>> 0 });
  }
  return points;
};

export const drawTree = (g: Graphics, x: number, y: number, size: number): void => {
  g.ellipse(x + 3, y + size * 0.55, size * 0.38, 6).fill({ color: 0x3a2a18, alpha: 0.16 });
  g.roundRect(x - 3, y, 6, size * 0.55, 2).fill(0x8b5a3c);
  g.circle(x - size * 0.18, y - 2, size * 0.42).fill(0x6fbf7a);
  g.circle(x + size * 0.2, y - 4, size * 0.46).fill(0x7ed48a);
  g.circle(x, y - size * 0.28, size * 0.4).fill(0x98e3a4);
};

export const drawFlower = (g: Graphics, x: number, y: number, color: number): void => {
  g.circle(x, y, 2.2).fill(color);
  g.circle(x, y, 1).fill(0xfff4b0);
};

export const drawCottage = (
  g: Graphics,
  x: number,
  y: number,
  wall: number,
  roof: number,
  night: boolean,
): void => {
  const width = 54;
  const height = 42;
  g.ellipse(x + width / 2, y + height - 2, width * 0.46, 7).fill({ color: 0x3a2a18, alpha: 0.16 });
  g.roundRect(x, y + 14, width, height - 14, 5).fill(wall);
  g.moveTo(x - 8, y + 18)
    .lineTo(x + width / 2, y - 10)
    .lineTo(x + width + 8, y + 18)
    .fill(roof);
  g.roundRect(x + width - 16, y - 6, 8, 16, 1).fill(0x9a6b5a);
  g.rect(x + width - 14, y - 10, 4, 5).fill(0xd9c4b8);
  const pane = night ? 0xffe7a8 : 0xd7eef8;
  g.roundRect(x + 8, y + 24, 11, 11, 2).fill(pane);
  g.roundRect(x + width - 19, y + 24, 11, 11, 2).fill(pane);
  g.roundRect(x + width / 2 - 7, y + height - 20, 14, 18, 3).fill(0x6d4334);
  g.circle(x + width / 2 + 3, y + height - 11, 1.4).fill(0xf2d38a);
};

export const drawStall = (g: Graphics, x: number, y: number, cloth: number): void => {
  g.roundRect(x, y + 18, 46, 18, 3).fill(0xe9d2b0);
  g.roundRect(x - 4, y + 8, 54, 14, 4).fill(cloth);
  g.rect(x + 6, y + 22, 8, 6).fill(0xe07a6a);
  g.rect(x + 18, y + 22, 8, 6).fill(0xf2c56b);
  g.rect(x + 30, y + 22, 8, 6).fill(0x7dbe8e);
};

export const drawFountain = (g: Graphics, x: number, y: number): void => {
  g.ellipse(x, y + 8, 34, 12).fill(0xc9ddd8);
  g.ellipse(x, y + 6, 26, 9).fill(0x8ec8d8);
  g.circle(x, y - 4, 8).fill(0xe8d19a);
  g.circle(x, y - 14, 4).fill(0xb7e4f2);
};

export const drawBarn = (g: Graphics, x: number, y: number): void => {
  g.roundRect(x, y + 20, 88, 48, 6).fill(0xc9896a);
  g.moveTo(x - 8, y + 24)
    .lineTo(x + 44, y - 8)
    .lineTo(x + 96, y + 24)
    .fill(0xa35d4a);
  g.roundRect(x + 34, y + 38, 20, 30, 3).fill(0x6d4334);
  g.roundRect(x + 10, y + 32, 14, 12, 2).fill(0xf2d38a);
};

export const drawCrops = (
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  for (let row = 0; row < height; row += 14) {
    g.roundRect(x, y + row, width, 8, 4).fill(row % 28 === 0 ? 0x8fce6a : 0x6fb35a);
  }
};
