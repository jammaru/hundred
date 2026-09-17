import type { ActiveAction } from './actions';
import type { DecisionState } from './decision';
import type { LocationId, NpcId } from './ids';
import type { Inventory } from './inventory';
import type { Job } from './jobs';
import type { MovementIntent, NpcLocation } from './location';
import type { Memory } from './memory';
import type { Needs } from './needs';
import type { Personality } from './personality';
import type { Relationship } from './relationship';

export const EXPRESSIONS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'afraid',
  'tired',
  'surprised',
] as const;

export type Expression = (typeof EXPRESSIONS)[number];

export interface NpcIdentity {
  name: string;
  age: number;
  avatarSeed: string;
  job: Job;
  homeId: LocationId;
  householdId: string;
}

export interface Npc {
  id: NpcId;
  identity: NpcIdentity;
  personality: Personality;
  needs: Needs;
  economy: {
    money: number;
    inventory: Inventory;
  };
  social: {
    relationships: Relationship[];
    memories: Memory[];
  };
  location: NpcLocation;
  movement?: MovementIntent;
  action: ActiveAction;
  decision: DecisionState;
  expression: Expression;
}

export const POPULATION = 100;
