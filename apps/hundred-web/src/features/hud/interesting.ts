import type { NpcPublic } from '@hundred/protocol';

export interface InterestingPerson {
  id: string;
  name: string;
  reason: string;
  score: number;
}

const reasonFor = (npc: NpcPublic): { reason: string; score: number } => {
  if (npc.action === 'fight') {
    return { reason: 'interesting.fight', score: 95 };
  }
  if (npc.action === 'steal') {
    return { reason: 'interesting.steal', score: 90 };
  }
  if (npc.action === 'help' || npc.action === 'ask_for_help') {
    return { reason: 'interesting.help', score: 72 };
  }
  if (npc.hunger >= 85 && npc.money < 12) {
    return { reason: 'interesting.broke', score: 80 };
  }
  if (npc.hunger >= 85) {
    return { reason: 'interesting.hungry', score: 58 };
  }
  if (npc.energy <= 12) {
    return { reason: 'interesting.exhausted', score: 54 };
  }
  if (npc.phase === 'idle' && npc.action === 'idle') {
    return { reason: 'interesting.deciding', score: 20 };
  }
  return { reason: 'interesting.deciding', score: 0 };
};

export const pickInteresting = (
  npcs: NpcPublic[],
  favoriteIds: ReadonlySet<string>,
): InterestingPerson[] => {
  return npcs
    .map((npc) => {
      const { reason, score } = reasonFor(npc);
      return {
        id: npc.id,
        name: npc.name,
        reason,
        score: score + (favoriteIds.has(npc.id) ? 6 : 0),
      };
    })
    .filter((item) => item.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

export const relationLabel = (trust: number): string | undefined => {
  if (trust >= 50) {
    return 'relation.close';
  }
  if (trust >= 20) {
    return 'relation.friend';
  }
  if (trust <= -40) {
    return 'relation.enemy';
  }
  if (trust <= -20) {
    return 'relation.distrust';
  }
  return undefined;
};

export const whyActing = (npc: {
  actionType?: string | undefined;
  needs: { hunger: number; energy: number; mood: number };
  money: number;
}): string[] => {
  const reasons: string[] = [];
  if (npc.needs.hunger >= 70) {
    reasons.push('interesting.hungry');
  }
  if (npc.money < 12 && (npc.actionType === 'steal' || npc.actionType === 'ask_for_help')) {
    reasons.push('interesting.broke');
  }
  if (npc.needs.energy <= 25) {
    reasons.push('interesting.exhausted');
  }
  return reasons;
};
