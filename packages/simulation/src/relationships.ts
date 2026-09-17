import { clampRelationship, type Npc, type NpcId } from '@hundred/domain';

export const getTrust = (npc: Npc, otherId: NpcId): number => {
  return npc.social.relationships.find((rel) => rel.npcId === otherId)?.trust ?? 0;
};

export const adjustTrust = (npc: Npc, otherId: NpcId, delta: number): number => {
  const existing = npc.social.relationships.find((rel) => rel.npcId === otherId);
  if (existing) {
    existing.trust = clampRelationship(existing.trust + delta);
    return existing.trust;
  }
  const trust = clampRelationship(delta);
  npc.social.relationships.push({ npcId: otherId, trust });
  npc.social.relationships.sort((a, b) => Math.abs(b.trust) - Math.abs(a.trust));
  if (npc.social.relationships.length > 16) {
    npc.social.relationships.length = 16;
  }
  return trust;
};
