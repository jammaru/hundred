import { WORLD_BOUNDS } from '@hundred/domain';
import { describe, expect, it } from 'vitest';

import { beginAction } from './actions';
import { advanceMovement, startMovement } from './movement';
import { createRng } from './rng';
import { createWorld } from './world-factory';

describe('bounded movement', () => {
  it('keeps a full journey inside the town, even with an invalid destination', () => {
    const world = createWorld(1, 1);
    const npc = world.npcs[0]!;
    startMovement(npc, { x: WORLD_BOUNDS.width + 1000, y: -1000 }, 0);
    const duration = npc.movement!.durationTicks;
    for (let tick = 0; tick <= duration; tick += 1) {
      world.clock.tick = tick;
      advanceMovement(world);
      expect(npc.location.position.x).toBeLessThanOrEqual(WORLD_BOUNDS.width - 64);
      expect(npc.location.position.y).toBeGreaterThanOrEqual(64);
    }
    expect(npc.movement).toBeUndefined();
  });

  it('does not make resting residents chase another person', () => {
    const world = createWorld(2, 2);
    const npc = world.npcs[0]!;
    npc.location.position = { x: 500, y: 500 };
    beginAction(
      world,
      npc,
      {
        selected: 'rest',
        probabilities: { rest: 1 },
        provider: 'rules',
        fallback: false,
        targetNpcId: world.npcs[1]!.id,
      },
      createRng(2),
    );
    expect(npc.movement!.to).toEqual({ x: 500, y: 500 });
    expect(npc.action.targetNpcId).toBeUndefined();
  });
});
