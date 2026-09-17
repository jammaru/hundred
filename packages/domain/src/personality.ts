export interface Personality {
  kindness: number;
  greed: number;
  courage: number;
  sociability: number;
  diligence: number;
}

export const PERSONALITY_TRAITS = [
  'kindness',
  'greed',
  'courage',
  'sociability',
  'diligence',
] as const;

export type PersonalityTrait = (typeof PERSONALITY_TRAITS)[number];
