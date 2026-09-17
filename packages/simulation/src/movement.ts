import type { Npc, Vec2, World } from '@hundred/domain';

import { containingLocation, distance, lerp } from './space';

export const startMovement = (npc: Npc, to: Vec2, tick: number, speed = 48): void => {
  const from = npc.location.position;
  const travel = Math.max(1, distance(from, to));
  const durationTicks = Math.max(8, Math.round((travel / speed) * 10));
  npc.movement = {
    from: { x: from.x, y: from.y },
    to,
    startTick: tick,
    durationTicks,
  };
};

export const advanceMovement = (world: World): void => {
  for (const npc of world.npcs) {
    const movement = npc.movement;
    if (!movement) {
      continue;
    }
    const elapsed = world.clock.tick - movement.startTick;
    const t = Math.min(1, elapsed / movement.durationTicks);
    npc.location.position = lerp(movement.from, movement.to, t);
    npc.location.locationId = containingLocation(world, npc.location.position).id;
    if (t >= 1) {
      delete npc.movement;
      if (npc.action.phase === 'moving') {
        npc.action.phase = 'acting';
      }
    }
  }
};

export const nearbyNpcs = (world: World, npc: Npc, radius = 120): Npc[] => {
  return world.npcs.filter(
    (other) =>
      other.id !== npc.id && distance(other.location.position, npc.location.position) <= radius,
  );
};
