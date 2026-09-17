import { describe, expect, it } from 'vitest';

import { appearanceFromSeed } from './appearance';

describe('appearanceFromSeed', () => {
  it('is stable', () => {
    expect(appearanceFromSeed('1:4')).toEqual(appearanceFromSeed('1:4'));
  });

  it('differs across seeds', () => {
    expect(appearanceFromSeed('1:4').hairStyle).not.toBe(appearanceFromSeed('2:9').hairStyle);
  });
});
