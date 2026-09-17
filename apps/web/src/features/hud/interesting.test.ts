import { describe, expect, it } from 'vitest';

import { pickInteresting, relationLabel, whyActing } from './interesting';

describe('interesting now', () => {
  it('surfaces hungry broke people and fights', () => {
    const people = pickInteresting(
      [
        {
          id: 'npc_a',
          name: 'Maya',
          age: 24,
          job: 'farmer',
          avatarSeed: 'a',
          position: { x: 0, y: 0 },
          action: 'idle',
          phase: 'idle',
          expression: 'sad',
          hunger: 91,
          energy: 40,
          money: 4,
          locationId: 'market',
        },
        {
          id: 'npc_b',
          name: 'Ken',
          age: 31,
          job: 'worker',
          avatarSeed: 'b',
          position: { x: 1, y: 1 },
          action: 'fight',
          phase: 'acting',
          expression: 'angry',
          hunger: 20,
          energy: 60,
          money: 40,
          locationId: 'plaza',
        },
      ],
      new Set(),
    );
    expect(people.map((person) => person.name)).toEqual(['Ken', 'Maya']);
  });

  it('labels close friends and enemies', () => {
    expect(relationLabel(72)).toBe('relation.close');
    expect(relationLabel(-44)).toBe('relation.enemy');
  });

  it('explains hunger-driven actions', () => {
    expect(
      whyActing({
        actionType: 'steal',
        needs: { hunger: 91, energy: 40, mood: 30 },
        money: 4,
      }),
    ).toContain('interesting.broke');
  });
});
