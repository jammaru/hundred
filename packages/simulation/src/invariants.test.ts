import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { beginAction } from './actions';
import { assertInvariants } from './invariants';
import { createRng } from './rng';
import { stepWorld } from './tick';
import { createWorld } from './world-factory';

describe('world invariants', () => {
  it('keeps needs in range across ticks', () => {
    const world = createWorld(7, 25);
    const rng = createRng(7);
    for (let i = 0; i < 40; i += 1) {
      stepWorld(world, rng);
    }
    expect(assertInvariants(world)).toEqual([]);
  });

  it('never lets hunger fall outside 0..100 for random action streams', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), (seed) => {
        const world = createWorld(seed, 8);
        const rng = createRng(seed);
        for (const npc of world.npcs) {
          beginAction(
            world,
            npc,
            {
              selected: 'rest',
              probabilities: { rest: 1 },
              provider: 'rules',
              fallback: false,
            },
            rng,
          );
        }
        for (let i = 0; i < 12; i += 1) {
          stepWorld(world, rng);
        }
        return world.npcs.every((npc) => npc.needs.hunger >= 0 && npc.needs.hunger <= 100);
      }),
      { numRuns: 20 },
    );
  });

  it('replays the same seed to the same population names', () => {
    const a = createWorld(42, 100);
    const b = createWorld(42, 100);
    expect(a.npcs.map((npc) => npc.identity.name)).toEqual(b.npcs.map((npc) => npc.identity.name));
  });
});
