import { describe, expect, it } from 'vitest';

import { createRng } from './rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(91831);
    const b = createRng(91831);
    const left = Array.from({ length: 8 }, () => a.next());
    const right = Array.from({ length: 8 }, () => b.next());
    expect(left).toEqual(right);
  });

  it('does not use Math.random', () => {
    const rng = createRng(1);
    expect(rng.intRange(3, 3)).toBe(3);
  });
});
