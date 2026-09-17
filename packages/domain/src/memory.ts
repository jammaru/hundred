import type { MemoryId, NpcId } from './ids';

export const MEMORY_TYPES = [
  'helped',
  'received_help',
  'gift',
  'conversation',
  'witnessed_theft',
  'stole',
  'attacked',
  'was_attacked',
  'refused_help',
  'worked',
  'bought_food',
  'ate',
  'rumor',
  'witnessed_fight',
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export interface Memory {
  id: MemoryId;
  type: MemoryType;
  subjectId?: NpcId;
  targetId?: NpcId;
  valence: number;
  importance: number;
  source: 'direct' | 'rumor';
  tick: number;
}

export const MEMORY_LIMIT = 16;
export const MEMORY_DECISION_COUNT = 4;
