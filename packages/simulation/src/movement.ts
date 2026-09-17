import { WORLD_BOUNDS, type Npc, type Vec2, type World } from '@hundred/domain';

import { containingLocation, distance, lerp } from './space';

const bounded = (point: Vec2): Vec2 => ({
  x: Math.max(64, Math.min(WORLD_BOUNDS.width - 64, Number.isFinite(point.x) ? point.x : 64)),
  y: Math.max(64, Math.min(WORLD_BOUNDS.height - 64, Number.isFinite(point.y) ? point.y : 64)),
});

export const startMovement = (npc: Npc, to: Vec2, tick: number, speed = 48): void => {
  const from = bounded(npc.location.position);
  to = bounded(to);
  npc.location.position = from;
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
    npc.location.position = bounded(npc.location.position);
    const movement = npc.movement;
    if (!movement) {
      continue;
    }
    const elapsed = world.clock.tick - movement.startTick;
    const t = Math.max(0, Math.min(1, elapsed / Math.max(1, movement.durationTicks)));
    npc.location.position = bounded(lerp(bounded(movement.from), bounded(movement.to), t));
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
