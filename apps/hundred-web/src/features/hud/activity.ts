import type { NpcPublic } from '@hundred/protocol';

const CENSUS_ORDER = [
  'steal',
  'fight',
  'help',
  'ask_for_help',
  'buy_food',
  'talk',
  'work',
  'eat',
  'sleep',
  'visit',
] as const;

const DRAMATIC = new Set(['steal', 'fight', 'help', 'intervene', 'flee']);

export const countBusyActions = (
  npcs: readonly NpcPublic[],
): Array<{ action: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const npc of npcs) {
    if (npc.action === 'idle') {
      continue;
    }
    counts.set(npc.action, (counts.get(npc.action) ?? 0) + 1);
  }
  return CENSUS_ORDER.map((action) => ({ action, count: counts.get(action) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export const shouldCaptionNpc = (
  npc: NpcPublic,
  named: boolean,
  selected: boolean,
  hovered: boolean,
  followed: boolean,
): boolean => {
  if (selected || hovered || followed) {
    return npc.action !== 'idle';
  }
  if (DRAMATIC.has(npc.action)) {
    return true;
  }
  return named && npc.action !== 'idle';
};

export const rankBusyPeople = (npcs: readonly NpcPublic[], limit = 10): NpcPublic[] => {
  return [...npcs].sort((a, b) => busyScore(b) - busyScore(a)).slice(0, limit);
};

const busyScore = (npc: NpcPublic): number => {
  if (npc.action === 'fight') {
    return 100;
  }
  if (npc.action === 'steal') {
    return 95;
  }
  if (npc.action === 'intervene' || npc.action === 'flee') {
    return 88;
  }
  if (npc.action === 'help') {
    return 80;
  }
  if (npc.action === 'ask_for_help') {
    return 74;
  }
  if (npc.hunger >= 85 && npc.money < 12) {
    return 70;
  }
  if (npc.action === 'buy_food') {
    return 42;
  }
  if (npc.action === 'talk' || npc.action === 'visit') {
    return 28;
  }
  if (npc.action !== 'idle') {
    return 10;
  }
  return 0;
};
