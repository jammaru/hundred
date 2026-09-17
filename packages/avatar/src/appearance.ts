const SKIN_TONES = [
  '#f6d7b8',
  '#efc8a4',
  '#e3b48a',
  '#d1a074',
  '#c68642',
  '#a86838',
  '#8d5524',
  '#5c3310',
] as const;

const HAIR_COLORS = [
  '#1f1a17',
  '#3b2a1a',
  '#6b3a1f',
  '#b5522a',
  '#d8a04e',
  '#f0d38a',
  '#4a3f73',
  '#2c4c3b',
] as const;

const OUTFIT_COLORS = [
  '#c45c4a',
  '#d98a3a',
  '#e3c15a',
  '#6f9e5e',
  '#4f8f7b',
  '#4a7ea8',
  '#5b62a8',
  '#8a5d9c',
  '#b86b8a',
  '#6d6a63',
  '#3f4a57',
  '#a3523d',
] as const;

export const EXPRESSIONS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'afraid',
  'tired',
  'surprised',
] as const;

export type AvatarExpression = (typeof EXPRESSIONS)[number];

export interface AvatarAppearance {
  seed: string;
  headShape: number;
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  eyes: number;
  brows: number;
  mouth: number;
  outfit: number;
  outfitColor: number;
  accessory: number;
  body: number;
}

const hash = (input: string): number => {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
};

const pick = (seed: number, salt: number, count: number): number => {
  const mixed = Math.imul(seed ^ salt, 0x9e3779b9) >>> 0;
  return mixed % count;
};

export const appearanceFromSeed = (seed: string): AvatarAppearance => {
  const value = hash(seed);
  return {
    seed,
    headShape: pick(value, 11, 4),
    skinTone: pick(value, 23, SKIN_TONES.length),
    hairStyle: pick(value, 37, 14),
    hairColor: pick(value, 53, HAIR_COLORS.length),
    eyes: pick(value, 71, 6),
    brows: pick(value, 89, 5),
    mouth: pick(value, 101, 6),
    outfit: pick(value, 131, 10),
    outfitColor: pick(value, 151, OUTFIT_COLORS.length),
    accessory: pick(value, 181, 8),
    body: pick(value, 199, 4),
  };
};

export const skinColor = (appearance: AvatarAppearance): string =>
  SKIN_TONES[appearance.skinTone] ?? SKIN_TONES[0];

export const hairColor = (appearance: AvatarAppearance): string =>
  HAIR_COLORS[appearance.hairColor] ?? HAIR_COLORS[0];

export const outfitColor = (appearance: AvatarAppearance): string =>
  OUTFIT_COLORS[appearance.outfitColor] ?? OUTFIT_COLORS[0];
