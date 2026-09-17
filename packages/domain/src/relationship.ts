import type { NpcId } from './ids';

export interface Relationship {
  npcId: NpcId;
  trust: number;
}

export const RELATIONSHIP_DELTAS = {
  help: 10,
  gift: 8,
  conversation: 2,
  steal: -30,
  fight: -50,
  rumor: -8,
} as const;
