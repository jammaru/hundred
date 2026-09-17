import { Assets, Texture } from 'pixi.js';

const SPRITE_NAMES = [
  'building-home',
  'building-farm',
  'building-tavern',
  'building-clinic',
  'building-workshop',
  'prop-windmill',
  'prop-tree-1',
  'prop-tree-2',
  'prop-fountain',
  'prop-pond',
  'prop-stall-1',
  'prop-stall-2',
  'prop-bridge',
  'prop-lantern',
  'prop-flowers',
  'prop-grass',
  'prop-stone',
  'villager-1',
  'villager-2',
  'villager-3',
  'villager-4',
  'villager-5',
  'villager-6',
] as const;

export type SpriteName = (typeof SPRITE_NAMES)[number];

export type SpriteSet = Record<SpriteName, Texture>;

export const VILLAGER_SPRITES: SpriteName[] = [
  'villager-1',
  'villager-2',
  'villager-3',
  'villager-4',
  'villager-5',
  'villager-6',
];

export const loadSprites = async (): Promise<SpriteSet> => {
  const entries = await Promise.all(
    SPRITE_NAMES.map(async (name) => {
      const texture = await Assets.load<Texture>(`/assets/sprites/${name}.png`);
      texture.source.scaleMode = 'linear';
      return [name, texture] as const;
    }),
  );
  return Object.fromEntries(entries) as SpriteSet;
};
