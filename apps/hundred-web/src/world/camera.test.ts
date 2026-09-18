import { describe, expect, it } from 'vitest';

import { facingOf, nearbyPeople } from './camera';

const person = (
  id: string,
  x: number,
  y: number,
  movement?: { from: { x: number; y: number }; to: { x: number; y: number } },
) => ({
  id,
  name: id,
  age: 20,
  job: 'farmer',
  avatarSeed: id,
  position: { x, y },
  action: 'idle' as const,
  phase: 'idle' as const,
  expression: 'neutral' as const,
  hunger: 10,
  energy: 80,
  money: 20,
  locationId: 'plaza',
  ...(movement ? { movement: { ...movement, startTick: 0, durationTicks: 8 } } : {}),
});

describe('camera helpers', () => {
  it('faces along movement', () => {
    const npc = person('a', 10, 10, { from: { x: 0, y: 0 }, to: { x: 10, y: 0 } });
    expect(facingOf(npc).x).toBeGreaterThan(0.9);
  });

  it('lists nearby people by distance', () => {
    const origin = person('a', 0, 0);
    const near = nearbyPeople(origin, [origin, person('b', 8, 0), person('c', 80, 0)], 20);
    expect(near.map((item) => item.id)).toEqual(['b']);
  });
});
