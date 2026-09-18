const VILLAGERS = [
  'villager-1',
  'villager-2',
  'villager-3',
  'villager-4',
  'villager-5',
  'villager-6',
] as const;

/** Keep each resident's appearance identical in the world and inspector. */
export const villagerSpriteName = (seed: string): (typeof VILLAGERS)[number] => {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return VILLAGERS[(hash >>> 0) % VILLAGERS.length]!;
};
