import type { World, WorldEvent } from '@hundred/domain';

import { resolveAction } from './actions';
import { advanceClock } from './clock';
import { produceFood } from './economy';
import { expireAtmosphere } from './god';
import { advanceMovement } from './movement';
import { decayNeeds, expressionFor } from './needs';
import type { Rng } from './rng';

export const stepWorld = (world: World, rng: Rng): WorldEvent[] => {
  advanceClock(world);
  expireAtmosphere(world);
  decayNeeds(world);
  advanceMovement(world);
  produceFood(world);
  const events: WorldEvent[] = [];
  for (const npc of world.npcs) {
    if (npc.action.phase === 'acting' && world.clock.tick >= npc.action.endsTick) {
      events.push(...resolveAction(world, npc, rng.fork(world.clock.tick + npc.id.length)));
    }
    const urgent = npc.needs.hunger >= 86 || npc.needs.energy <= 12;
    if (urgent && npc.action.phase === 'idle' && npc.decision.status !== 'deciding') {
      npc.decision.dueTick = Math.min(npc.decision.dueTick, world.clock.tick);
    }
    npc.expression = expressionFor(npc);
  }
  return events;
};

export const npcsDueForDecision = (world: World): World['npcs'] => {
  return world.npcs.filter((npc) => {
    if (npc.decision.status === 'deciding') {
      return false;
    }
    if (npc.action.phase === 'moving' || npc.action.phase === 'acting') {
      return false;
    }
    return world.clock.tick >= npc.decision.dueTick;
  });
};
