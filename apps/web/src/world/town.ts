import type { WorldSnapshot } from '@hundred/protocol';
import { Container, Graphics, Text } from 'pixi.js';

import { locationLabel, type Locale } from '../i18n';
import {
  drawBarn,
  drawCottage,
  drawCrops,
  drawFlower,
  drawFountain,
  drawStall,
  drawTree,
  scatter,
} from './buildings';

export interface TownLayer {
  root: Container;
  labels: Array<{ id: string; kind: string; name: string; text: Text }>;
  night: Graphics;
}

export const createTown = (snapshot: WorldSnapshot, locale: Locale): TownLayer => {
  const root = new Container();
  const ground = new Graphics();
  ground.rect(0, 0, 1600, 1000).fill(0xcfe8b8);
  ground.ellipse(800, 520, 780, 430).fill(0xb7d992);
  const meadow = scatter('meadow', 90, 1600, 1000);
  for (const point of meadow) {
    if (point.n % 5 === 0) {
      drawTree(ground, point.x, point.y, 18 + (point.n % 10));
    } else if (point.n % 3 === 0) {
      drawFlower(ground, point.x, point.y, point.n % 2 === 0 ? 0xf4a4c4 : 0xf2d38a);
    } else {
      ground.ellipse(point.x, point.y, 6, 3).fill({ color: 0x8fce6a, alpha: 0.45 });
    }
  }
  const paths = new Graphics();
  const plaza = snapshot.locations.find((location) => location.kind === 'plaza');
  if (plaza) {
    const px = plaza.position.x + plaza.size.x / 2;
    const py = plaza.position.y + plaza.size.y / 2;
    for (const location of snapshot.locations) {
      const tx = location.position.x + location.size.x / 2;
      const ty = location.position.y + location.size.y / 2;
      paths.moveTo(px, py).lineTo(tx, ty).stroke({ width: 22, color: 0xe6d0a8, alpha: 0.95 });
      paths.moveTo(px, py).lineTo(tx, ty).stroke({ width: 12, color: 0xd4b98a, alpha: 0.55 });
    }
    paths.ellipse(px, py, 70, 42).fill(0xe9d7b0);
    drawFountain(paths, px, py);
  }
  root.addChild(ground, paths);
  const labels: TownLayer['labels'] = [];
  const night = new Graphics();

  for (const location of snapshot.locations) {
    const block = new Graphics();
    drawPlace(
      block,
      location.kind,
      location.position.x,
      location.position.y,
      location.size.x,
      location.size.y,
    );
    const lights = scatter(`${location.id}-windows`, 8, location.size.x - 20, location.size.y - 20);
    for (const lamp of lights) {
      night
        .circle(location.position.x + 10 + lamp.x, location.position.y + 10 + lamp.y, 4)
        .fill({ color: 0xffe7a8, alpha: 0.85 });
    }
    const text = new Text({
      text: locationLabel(locale, location),
      style: {
        fontFamily: '"M PLUS Rounded 1c", "Zen Maru Gothic", ui-rounded, sans-serif',
        fontSize: 13,
        fill: 0x5a4034,
        fontWeight: '700',
      },
    });
    text.x = location.position.x + 12;
    text.y = location.position.y - 4;
    root.addChild(block, text);
    labels.push({ id: location.id, kind: location.kind, name: location.name, text });
  }
  night.alpha = 0;
  root.addChild(night);
  return { root, labels, night };
};

export const relabelTown = (
  town: TownLayer,
  locale: Locale,
  occupancy: Record<string, number> = {},
  night = false,
): void => {
  town.night.alpha = night ? 0.9 : 0;
  for (const label of town.labels) {
    const name = locationLabel(locale, label);
    const count = occupancy[label.id] ?? 0;
    label.text.text = count > 0 ? `${name}  ${count}` : name;
  }
};

const drawPlace = (
  g: Graphics,
  kind: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  g.roundRect(x, y, width, height, 18).fill({ color: 0xfff6e8, alpha: 0.18 });
  if (kind === 'home') {
    const cols = 4;
    const rows = 2;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const roof = (col + row) % 2 === 0 ? 0xf29bb0 : 0x7ec8e3;
        drawCottage(g, x + 16 + col * 84, y + 28 + row * 86, 0xfff1dc, roof, false);
      }
    }
    return;
  }
  if (kind === 'farm') {
    drawCrops(g, x + 16, y + 28, width - 32, height - 90);
    drawBarn(g, x + width - 120, y + 18);
    g.roundRect(x + 12, y + height - 28, width - 24, 10, 4).fill(0x8b5a3c);
    return;
  }
  if (kind === 'market') {
    drawStall(g, x + 18, y + 36, 0xf29bb0);
    drawStall(g, x + 78, y + 48, 0x7ec8e3);
    drawStall(g, x + 132, y + 32, 0xf2c56b);
    return;
  }
  if (kind === 'tavern') {
    g.roundRect(x + 28, y + 36, 140, 88, 8).fill(0xe0a07a);
    g.moveTo(x + 18, y + 42)
      .lineTo(x + 98, y + 8)
      .lineTo(x + 178, y + 42)
      .fill(0xb45d5d);
    g.roundRect(x + 86, y + 78, 24, 46, 4).fill(0x6d4334);
    g.roundRect(x + 44, y + 54, 22, 18, 3).fill(0xffe7a8);
    g.roundRect(x + 130, y + 54, 22, 18, 3).fill(0xffe7a8);
    g.circle(x + 98, y + 28, 10).fill(0xf2c56b);
    return;
  }
  if (kind === 'clinic') {
    g.roundRect(x + 28, y + 36, 130, 84, 10).fill(0xf7fbff);
    g.moveTo(x + 20, y + 42)
      .lineTo(x + 93, y + 10)
      .lineTo(x + 166, y + 42)
      .fill(0x9ad7e8);
    g.roundRect(x + 84, y + 48, 18, 18, 3).fill(0xf29bb0);
    g.roundRect(x + 88, y + 52, 10, 10, 2).fill(0xfff6e8);
    return;
  }
  if (kind === 'workshop') {
    g.roundRect(x + 24, y + 40, 140, 80, 8).fill(0xd4b49a);
    g.roundRect(x + 40, y + 18, 28, 36, 4).fill(0x8a6a5a);
    g.roundRect(x + 48, y + 8, 12, 14, 2).fill(0xb9c4c8);
    g.roundRect(x + 70, y + 58, 22, 16, 2).fill(0xf2d38a);
    return;
  }
  if (kind === 'park') {
    drawTree(g, x + 40, y + 70, 28);
    drawTree(g, x + 120, y + 50, 34);
    drawTree(g, x + 220, y + 90, 30);
    g.ellipse(x + 160, y + 140, 48, 18).fill(0x8ec8d8);
    drawFlower(g, x + 70, y + 150, 0xf4a4c4);
    drawFlower(g, x + 90, y + 158, 0xf2d38a);
    return;
  }
  g.ellipse(x + width / 2, y + height / 2, 78, 44).fill({ color: 0xe9d7b0, alpha: 0.8 });
};
