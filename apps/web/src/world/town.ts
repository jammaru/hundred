import type { WorldSnapshot } from '@hundred/protocol';
import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';

import { locationLabel, type Locale } from '../i18n';
import type { SpriteSet, SpriteName } from './assets';

export interface TownLayer {
  root: Container;
  stage: Container;
  labels: Array<{ id: string; kind: string; name: string; text: Text }>;
  night: Container;
  festival: Container;
}

interface ScatterPoint {
  x: number;
  y: number;
  n: number;
}

const scatter = (seed: string, count: number, width: number, height: number): ScatterPoint[] => {
  const points: ScatterPoint[] = [];
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

const hashOf = (seed: string): number => {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const drawRiver = (g: Graphics, width: number, height: number): void => {
  g.moveTo(0, height * 0.52)
    .bezierCurveTo(
      width * 0.22,
      height * 0.44,
      width * 0.38,
      height * 0.6,
      width * 0.55,
      height * 0.5,
    )
    .bezierCurveTo(width * 0.72, height * 0.4, width * 0.88, height * 0.58, width, height * 0.46)
    .lineTo(width, height * 0.54)
    .bezierCurveTo(
      width * 0.88,
      height * 0.66,
      width * 0.72,
      height * 0.48,
      width * 0.55,
      height * 0.58,
    )
    .bezierCurveTo(width * 0.38, height * 0.68, width * 0.22, height * 0.52, 0, height * 0.6)
    .fill({ color: 0x5e93a8, alpha: 1 });
  g.moveTo(0, height * 0.535)
    .bezierCurveTo(
      width * 0.22,
      height * 0.455,
      width * 0.38,
      height * 0.615,
      width * 0.55,
      height * 0.515,
    )
    .bezierCurveTo(
      width * 0.72,
      height * 0.415,
      width * 0.88,
      height * 0.595,
      width,
      height * 0.475,
    )
    .stroke({ width: 10, color: 0x8fc3d4, alpha: 0.5 });
  g.moveTo(0, height * 0.52)
    .bezierCurveTo(
      width * 0.22,
      height * 0.44,
      width * 0.38,
      height * 0.6,
      width * 0.55,
      height * 0.5,
    )
    .bezierCurveTo(width * 0.72, height * 0.4, width * 0.88, height * 0.58, width, height * 0.46)
    .stroke({ width: 3, color: 0x4a7c8f, alpha: 0.6 });
  g.moveTo(0, height * 0.6)
    .bezierCurveTo(
      width * 0.22,
      height * 0.52,
      width * 0.38,
      height * 0.68,
      width * 0.55,
      height * 0.58,
    )
    .bezierCurveTo(width * 0.72, height * 0.48, width * 0.88, height * 0.66, width, height * 0.54)
    .stroke({ width: 3, color: 0x4a7c8f, alpha: 0.6 });
};

const drawPaths = (g: Graphics, snapshot: WorldSnapshot): void => {
  const plaza = snapshot.locations.find((location) => location.kind === 'plaza');
  if (!plaza) {
    return;
  }
  const px = plaza.position.x + plaza.size.x / 2;
  const py = plaza.position.y + plaza.size.y / 2;
  for (const location of snapshot.locations) {
    if (location.id === plaza.id) {
      continue;
    }
    const tx = location.position.x + location.size.x / 2;
    const ty = location.position.y + location.size.y / 2;
    g.moveTo(px, py)
      .lineTo(tx, ty)
      .stroke({ width: 30, color: 0xc4ac7e, alpha: 0.85, cap: 'round' });
    g.moveTo(px, py)
      .lineTo(tx, ty)
      .stroke({ width: 18, color: 0xd6c096, alpha: 0.9, cap: 'round' });
  }
  g.ellipse(px, py, 150, 100).fill(0xd6c096);
  g.ellipse(px, py, 150, 100).stroke({ width: 6, color: 0xc4ac7e, alpha: 0.9 });
};

const insideLocation = (snapshot: WorldSnapshot, x: number, y: number, margin: number): boolean =>
  snapshot.locations.some(
    (location) =>
      x >= location.position.x - margin &&
      x <= location.position.x + location.size.x + margin &&
      y >= location.position.y - margin &&
      y <= location.position.y + location.size.y + margin,
  );

interface Placement {
  sprite: Sprite;
  shadow: Graphics;
}

const place = (
  stage: Container,
  texture: Texture,
  centerX: number,
  baseY: number,
  worldWidth: number,
  options: { shadow?: number; rotation?: number } = {},
): Placement => {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 1);
  const scale = worldWidth / texture.width;
  sprite.scale.set(scale);
  if (options.rotation) {
    sprite.rotation = options.rotation;
  }
  sprite.position.set(centerX, baseY);
  sprite.zIndex = baseY;
  const shadow = new Graphics();
  const shadowWidth = worldWidth * (options.shadow ?? 0.42);
  shadow
    .ellipse(centerX + worldWidth * 0.04, baseY - worldWidth * 0.02, shadowWidth, shadowWidth * 0.3)
    .fill({ color: 0x1c2a14, alpha: 0.22 });
  shadow.zIndex = baseY - 1;
  stage.addChild(shadow, sprite);
  return { sprite, shadow };
};

const placeBuilding = (
  stage: Container,
  sprites: SpriteSet,
  name: SpriteName,
  centerX: number,
  baseY: number,
  worldWidth: number,
): Placement => place(stage, sprites[name], centerX, baseY, worldWidth);

const buildHome = (
  stage: Container,
  sprites: SpriteSet,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
): void => {
  const cols = Math.max(2, Math.floor((w - 60) / 170));
  const rows = Math.max(1, Math.floor((h - 60) / 150));
  const points = scatter(seed, cols * rows, 40, 40);
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const jitter = points[index] ?? { x: 20, y: 20, n: 0 };
      index += 1;
      const cx = x + 70 + col * ((w - 140) / Math.max(1, cols - 1) || 0) + (jitter.x - 20);
      const by = y + 110 + row * ((h - 150) / Math.max(1, rows - 1) || 0) + (jitter.y - 20);
      placeBuilding(stage, sprites, 'building-home', cx, by, 150);
    }
  }
};

const buildFarm = (
  stage: Container,
  sprites: SpriteSet,
  ground: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void => {
  const fieldW = w - 260;
  const fieldH = h - 90;
  ground.roundRect(x + 20, y + 40, fieldW, fieldH, 12).fill(0x9a7c58);
  for (let row = 0; row < fieldH; row += 22) {
    ground
      .roundRect(x + 28, y + 46 + row, fieldW - 16, 12, 6)
      .fill(row % 44 === 0 ? 0x7ba95c : 0x8fbf6a);
  }
  placeBuilding(stage, sprites, 'building-farm', x + w - 130, y + 170, 210);
  if (w > 500) {
    placeBuilding(stage, sprites, 'prop-windmill', x + w - 210, y + h - 40, 150);
  }
};

const buildMarket = (
  stage: Container,
  sprites: SpriteSet,
  x: number,
  y: number,
  w: number,
): void => {
  const stalls: SpriteName[] = ['prop-stall-1', 'prop-stall-2', 'prop-stall-1', 'prop-stall-2'];
  const spots = [
    { cx: x + 80, by: y + 130 },
    { cx: x + w - 80, by: y + 130 },
    { cx: x + 80, by: y + 240 },
    { cx: x + w - 80, by: y + 240 },
  ];
  spots.forEach((spot, index) => {
    placeBuilding(stage, sprites, stalls[index % stalls.length]!, spot.cx, spot.by, 130);
  });
};

const buildPark = (
  stage: Container,
  sprites: SpriteSet,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
): void => {
  placeBuilding(stage, sprites, 'prop-pond', x + w * 0.45, y + h * 0.62, 220);
  const trees = scatter(`${seed}-trees`, 6, w - 160, h - 200);
  for (const point of trees) {
    const kind: SpriteName = point.n % 3 === 0 ? 'prop-tree-2' : 'prop-tree-1';
    placeBuilding(stage, sprites, kind, x + 90 + point.x, y + 150 + point.y, 110 + (point.n % 40));
  }
  const blooms = scatter(`${seed}-blooms`, 5, w - 120, h - 160);
  for (const point of blooms) {
    place(stage, sprites['prop-flowers'], x + 60 + point.x, y + 120 + point.y, 56, { shadow: 0 });
  }
};

const FESTIVAL_LANTERNS = 10;

export const createTown = (
  snapshot: WorldSnapshot,
  locale: Locale,
  sprites: SpriteSet,
): TownLayer => {
  const width = snapshot.bounds.width;
  const height = snapshot.bounds.height;
  const root = new Container();
  root.sortableChildren = true;

  const ground = new Graphics();
  ground.rect(0, 0, width, height).fill(0x9dbd7e);
  ground
    .ellipse(width * 0.5, height * 0.52, width * 0.48, height * 0.4)
    .fill({ color: 0x8fb26f, alpha: 0.55 });
  ground
    .ellipse(width * 0.16, height * 0.2, width * 0.2, height * 0.16)
    .fill({ color: 0xaac78c, alpha: 0.5 });
  ground
    .ellipse(width * 0.85, height * 0.82, width * 0.22, height * 0.18)
    .fill({ color: 0x94b775, alpha: 0.5 });
  drawRiver(ground, width, height);
  drawPaths(ground, snapshot);
  ground.zIndex = 0;
  root.addChild(ground);

  const detail = new Container();
  detail.zIndex = 0.5;
  const tufts = scatter('meadow-tufts', 150, width, height);
  for (const point of tufts) {
    if (insideLocation(snapshot, point.x, point.y, 30)) {
      continue;
    }
    const sprite = new Sprite(sprites['prop-grass']);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set((26 + (point.n % 18)) / sprites['prop-grass'].width);
    sprite.position.set(point.x, point.y);
    detail.addChild(sprite);
  }
  const blooms = scatter('meadow-blooms', 46, width, height);
  for (const point of blooms) {
    if (insideLocation(snapshot, point.x, point.y, 30)) {
      continue;
    }
    const sprite = new Sprite(sprites['prop-flowers']);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set((34 + (point.n % 20)) / sprites['prop-flowers'].width);
    sprite.position.set(point.x, point.y);
    detail.addChild(sprite);
  }
  const pebbles = scatter('meadow-stones', 30, width, height);
  for (const point of pebbles) {
    if (insideLocation(snapshot, point.x, point.y, 20)) {
      continue;
    }
    const sprite = new Sprite(sprites['prop-stone']);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set((24 + (point.n % 16)) / sprites['prop-stone'].width);
    sprite.position.set(point.x, point.y);
    detail.addChild(sprite);
  }
  root.addChild(detail);

  const stage = new Container();
  stage.sortableChildren = true;
  stage.zIndex = 1;
  root.addChild(stage);

  const trees = scatter('meadow-trees', 42, width, height);
  for (const point of trees) {
    if (insideLocation(snapshot, point.x, point.y, 60)) {
      continue;
    }
    const kind: SpriteName = point.n % 4 === 0 ? 'prop-tree-2' : 'prop-tree-1';
    place(stage, sprites[kind], point.x, point.y, 96 + (point.n % 48));
  }

  const bridge = new Sprite(sprites['prop-bridge']);
  bridge.anchor.set(0.5, 0.5);
  bridge.rotation = Math.PI / 2;
  bridge.scale.set(150 / sprites['prop-bridge'].width);
  bridge.position.set(width * 0.55, height * 0.535);
  bridge.zIndex = height * 0.535;
  stage.addChild(bridge);

  const labels: TownLayer['labels'] = [];
  const night = new Container();
  night.zIndex = 3;
  const festival = new Container();
  festival.visible = false;

  for (const location of snapshot.locations) {
    const { x, y } = location.position;
    const w = location.size.x;
    const h = location.size.y;
    if (location.kind === 'home') {
      buildHome(stage, sprites, x, y, w, h, location.id);
    } else if (location.kind === 'farm') {
      buildFarm(stage, sprites, ground, x, y, w, h);
    } else if (location.kind === 'market') {
      buildMarket(stage, sprites, x, y, w);
    } else if (location.kind === 'tavern') {
      placeBuilding(
        stage,
        sprites,
        'building-tavern',
        x + w / 2,
        y + h * 0.82,
        Math.min(w, h) * 0.92,
      );
    } else if (location.kind === 'clinic') {
      placeBuilding(
        stage,
        sprites,
        'building-clinic',
        x + w / 2,
        y + h * 0.82,
        Math.min(w, h) * 0.95,
      );
    } else if (location.kind === 'workshop') {
      placeBuilding(
        stage,
        sprites,
        'building-workshop',
        x + w / 2,
        y + h * 0.82,
        Math.min(w, h) * 0.95,
      );
    } else if (location.kind === 'park') {
      buildPark(stage, sprites, x, y, w, h, location.id);
    } else if (location.kind === 'plaza') {
      placeBuilding(stage, sprites, 'prop-fountain', x + w / 2, y + h / 2 + 40, 150);
      for (let index = 0; index < FESTIVAL_LANTERNS; index += 1) {
        const angle = (index / FESTIVAL_LANTERNS) * Math.PI * 2;
        const lx = x + w / 2 + Math.cos(angle) * 168;
        const ly = y + h / 2 + Math.sin(angle) * 112;
        const lantern = new Sprite(sprites['prop-lantern']);
        lantern.anchor.set(0.5, 1);
        lantern.scale.set(44 / sprites['prop-lantern'].width);
        lantern.position.set(lx, ly);
        lantern.zIndex = ly;
        festival.addChild(lantern);
      }
    }

    if (location.kind !== 'park' && location.kind !== 'farm') {
      const glow = new Graphics();
      const cx = x + w / 2;
      const cy = y + h / 2;
      glow.ellipse(cx, cy, w * 0.4, h * 0.32).fill({ color: 0xffca7a, alpha: 0.16 });
      const lamps = scatter(`${location.id}-windows`, 6, w - 60, h - 60);
      for (const lamp of lamps) {
        glow.circle(x + 30 + lamp.x, y + 30 + lamp.y, 7).fill({ color: 0xffe2a8, alpha: 0.75 });
      }
      night.addChild(glow);
    }

    const text = new Text({
      text: locationLabel(locale, location),
      style: {
        fontFamily: '"M PLUS Rounded 1c", "Zen Maru Gothic", ui-rounded, sans-serif',
        fontSize: 15,
        fill: 0x37412c,
        fontWeight: '700',
        stroke: { color: 0xe9ecd8, width: 5, join: 'round' },
      },
    });
    text.x = location.position.x + 12;
    text.y = location.position.y - 8;
    text.zIndex = 2;
    root.addChild(text);
    labels.push({ id: location.id, kind: location.kind, name: location.name, text });
  }

  night.alpha = 0;
  root.addChild(night);
  stage.addChild(festival);
  return { root, stage, labels, night, festival };
};

export const villagerIndexFor = (avatarSeed: string, count: number): number =>
  hashOf(avatarSeed) % count;

export const relabelTown = (
  town: TownLayer,
  locale: Locale,
  occupancy: Record<string, number> = {},
): void => {
  for (const label of town.labels) {
    const name = locationLabel(locale, label);
    const count = occupancy[label.id] ?? 0;
    label.text.text = count > 0 ? `${name}  ${count}` : name;
  }
};
