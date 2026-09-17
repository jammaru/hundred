import { describe, expect, it } from 'vitest';

import { clampNeed } from './clamp';
import type { Needs } from './needs';

describe('clampNeed', () => {
  it('keeps values inside 0..100', () => {
    expect(clampNeed(-4)).toBe(0);
    expect(clampNeed(140)).toBe(100);
    expect(clampNeed(44)).toBe(44);
  });

  it('rejects non-finite values', () => {
    expect(clampNeed(Number.NaN)).toBe(0);
    expect(clampNeed(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('Needs shape', () => {
  it('stores four axes', () => {
    const needs: Needs = { hunger: 10, energy: 20, health: 30, mood: 40 };
    expect(Object.keys(needs)).toHaveLength(4);
  });
});
