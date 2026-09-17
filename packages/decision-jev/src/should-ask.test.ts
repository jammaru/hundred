import { availableActionsFor, buildDecisionContext, createWorld } from '@hundred/simulation';
import { describe, expect, it } from 'vitest';

import { shouldAskJev } from './should-ask';

describe('shouldAskJev', () => {
  it('skips routine daytime work', () => {
    const world = createWorld(4, 20);
    for (const person of world.npcs) {
      person.needs.hunger = 18;
      person.needs.energy = 80;
    }
    const worker = world.npcs.find((npc) => npc.identity.job === 'worker') ?? world.npcs[0]!;
    worker.location.position = { x: 3000, y: 2100 };
    world.clock.minuteOfDay = 10 * 60;
    const context = buildDecisionContext(world, worker);
    expect(availableActionsFor(world, worker).some((action) => action.type === 'work')).toBe(true);
    expect(shouldAskJev(context)).toBe(false);
  });

  it('asks when theft is on the table', () => {
    const world = createWorld(4, 12);
    const npc = world.npcs[0]!;
    npc.needs.hunger = 82;
    npc.economy.money = 0;
    npc.economy.inventory.food = 0;
    world.clock.minuteOfDay = 11 * 60;
    world.shop.foodStock = 40;
    const context = buildDecisionContext(world, npc);
    expect(context.availableActions.some((action) => action.type === 'steal')).toBe(true);
    expect(shouldAskJev(context)).toBe(true);
  });
});
