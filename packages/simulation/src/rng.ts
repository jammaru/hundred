export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  intRange(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  fork(salt: number): Rng;
}

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const createRng = (seed: number): Rng => {
  const next = mulberry32(seed);
  const rng: Rng = {
    next,
    int(maxExclusive) {
      if (maxExclusive <= 0) {
        return 0;
      }
      return Math.floor(next() * maxExclusive);
    },
    intRange(minInclusive, maxInclusive) {
      if (maxInclusive <= minInclusive) {
        return minInclusive;
      }
      return minInclusive + rng.int(maxInclusive - minInclusive + 1);
    },
    pick<T>(items: readonly T[]): T {
      const item = items[rng.int(items.length)];
      if (item === undefined) {
        throw new Error('Cannot pick from an empty list');
      }
      return item;
    },
    chance(probability) {
      return next() < probability;
    },
    fork(salt) {
      return createRng((seed ^ (salt * 0x9e3779b9)) >>> 0);
    },
  };
  return rng;
};

export const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
