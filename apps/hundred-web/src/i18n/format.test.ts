import { describe, expect, it } from 'vitest';

import { formatEvent, formatEventTime, formatMemory, t } from './format';

describe('i18n', () => {
  it('translates chrome into Japanese', () => {
    expect(t('ja', 'inspector.empty')).toContain('クリック');
    expect(t('ja', 'activity.title')).toBe('いま起きていること');
    expect(t('en', 'activity.chose', { name: 'Maya', action: 'Help' })).toContain('Maya');
  });

  it('formats events from structured fields', () => {
    const text = formatEvent('ja', {
      type: 'event.created',
      id: '1',
      tick: 10,
      text: 'Maya Sato stole food from the Market.',
      important: true,
      category: 'crime',
      npcIds: ['npc_001'],
      kind: 'theft',
      actorName: 'Maya Sato',
    });
    expect(text).toContain('Maya Sato');
    expect(text).toContain('盗んだ');
  });

  it('formats world shifts', () => {
    const text = formatEvent('ja', {
      type: 'event.created',
      id: '2',
      tick: 12,
      text: 'Rain began to fall over the town.',
      important: true,
      category: 'normal',
      npcIds: [],
      kind: 'world_shift',
      shift: 'rain',
      day: 1,
      minuteOfDay: 14 * 60 + 31,
    });
    expect(text).toContain('雨');
  });

  it('formats event clocks', () => {
    expect(
      formatEventTime('ja', {
        type: 'event.created',
        id: '3',
        tick: 12,
        text: 'Rain began to fall over the town.',
        important: true,
        category: 'normal',
        npcIds: [],
        kind: 'world_shift',
        shift: 'rain',
        day: 1,
        minuteOfDay: 14 * 60 + 31,
      }),
    ).toBe('1日目 14:31');
  });

  it('formats memories from structured fields', () => {
    const text = formatMemory('ja', {
      age: '3m',
      ageMinutes: 3,
      text: 'I talked with Ken Sato.',
      memoryType: 'conversation',
      targetName: 'Ken Sato',
    });
    expect(text).toContain('Ken Sato');
    expect(text).toContain('話した');
  });
});
