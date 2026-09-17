import type { NpcPublic } from '@hundred/protocol';

export type CameraMode = 'town' | 'follow' | 'first';

export const facingOf = (npc: NpcPublic): { x: number; y: number } => {
  const movement = npc.movement;
  if (!movement) {
    return { x: 0, y: 1 };
  }
  const dx = movement.to.x - movement.from.x;
  const dy = movement.to.y - movement.from.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) {
    return { x: 0, y: 1 };
  }
  return { x: dx / length, y: dy / length };
};

export const nearbyPeople = (
  origin: NpcPublic,
  people: Iterable<NpcPublic>,
  radius: number,
): NpcPublic[] => {
  const found: NpcPublic[] = [];
  for (const person of people) {
    if (person.id === origin.id) {
      continue;
    }
    if (
      Math.hypot(person.position.x - origin.position.x, person.position.y - origin.position.y) <=
      radius
    ) {
      found.push(person);
    }
  }
  return found.sort(
    (left, right) =>
      Math.hypot(left.position.x - origin.position.x, left.position.y - origin.position.y) -
      Math.hypot(right.position.x - origin.position.x, right.position.y - origin.position.y),
  );
};
