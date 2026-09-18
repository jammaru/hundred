import type { NpcPublic } from '@hundred/protocol';
import { describe, expect, it } from 'vitest';

import { countBusyActions, rankBusyPeople, shouldCaptionNpc } from './activity';

const person = (
  overrides: Partial<NpcPublic> & Pick<NpcPublic, 'id' | 'name' | 'action'>,
): NpcPublic => ({
  age: 30,
  job: 'worker',
  avatarSeed: 'a',
  position: { x: 0, y: 0 },
  phase: 'acting',
  expression: 'neutral',
  hunger: 40,
  energy: 50,
  money: 20,
  locationId: 'plaza',
  ...overrides,
});

describe('activity overlay', () => {
  it('counts what people are doing now', () => {
    const rows = countBusyActions([
      person({ id: '1', name: 'A', action: 'ask_for_help' }),
      person({ id: '2', name: 'B', action: 'ask_for_help' }),
      person({ id: '3', name: 'C', action: 'work' }),
      person({ id: '4', name: 'D', action: 'idle' }),
    ]);
    expect(rows[0]).toEqual({ action: 'ask_for_help', count: 2 });
    expect(rows.map((row) => row.action)).not.toContain('idle');
  });

  it('captions fights always and idle never', () => {
    const fighter = person({ id: '1', name: 'Ken', action: 'fight' });
    const idle = person({ id: '2', name: 'Mia', action: 'idle' });
    expect(shouldCaptionNpc(fighter, false, false, false, false)).toBe(true);
    expect(shouldCaptionNpc(idle, true, true, true, true)).toBe(false);
  });

  it('ranks busy people ahead of idle walkers', () => {
    const ranked = rankBusyPeople([
      person({ id: '1', name: 'Idle', action: 'idle' }),
      person({ id: '2', name: 'Maya', action: 'steal' }),
      person({ id: '3', name: 'Ken', action: 'work' }),
    ]);
    expect(ranked.map((npc) => npc.name)).toEqual(['Maya', 'Ken', 'Idle']);
  });
});
