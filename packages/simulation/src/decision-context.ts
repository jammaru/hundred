import {
  MEMORY_DECISION_COUNT,
  type AvailableAction,
  type Npc,
  type Personality,
  type World,
} from '@hundred/domain';

import { availableActionsFor } from './available-actions';
import { dayPeriod, isFestival, isRaining, isRestDay, isShopOpen, type DayPeriod } from './clock';
import { memoryTemplate, relevantMemories } from './memories';
import { nearbyNpcs } from './movement';
import { getTrust } from './relationships';
import { hashString } from './rng';
import { locationById } from './space';

interface NearbyPersonSummary {
  id: string;
  name: string;
  job: string;
  trust: number;
  action: string;
  hunger: number;
  household: boolean;
}

interface SocialTie {
  id: string;
  name: string;
  trust: number;
  household: boolean;
}

interface DecisionNpcView {
  id: string;
  name: string;
  traits: Personality;
  needs: Npc['needs'];
  money: number;
  job: Npc['identity']['job'];
  currentAction: Npc['action']['type'];
  householdId: string;
}

export type { DayPeriod } from './clock';

export interface EngineDecisionContext {
  seed: number;
  tick: number;
  clock: {
    day: number;
    minuteOfDay: number;
    period: DayPeriod;
    shopOpen: boolean;
    restDay: boolean;
    raining: boolean;
    festival: boolean;
  };
  npc: DecisionNpcView;
  location: {
    id: string;
    name: string;
    kind: string;
  };
  nearbyPeople: NearbyPersonSummary[];
  ties: SocialTie[];
  memories: Array<{ text: string; importance: number }>;
  availableActions: AvailableAction[];
}

export const buildDecisionContext = (world: World, npc: Npc): EngineDecisionContext => {
  const location = locationById(world, npc.location.locationId);
  const names = new Map(world.npcs.map((person) => [person.id, person.identity.name] as const));
  const nameOf = (id: typeof npc.id) => names.get(id) ?? 'Someone';
  const nearby = nearbyNpcs(world, npc)
    .filter((other) => other.action.type !== 'sleep')
    .slice(0, 4)
    .map((other) => ({
      id: other.id,
      name: other.identity.name,
      job: other.identity.job,
      trust: getTrust(npc, other.id),
      action: other.action.type,
      hunger: Math.round(other.needs.hunger),
      household: other.identity.householdId === npc.identity.householdId,
    }));
  const housemates = world.npcs
    .filter(
      (other) => other.id !== npc.id && other.identity.householdId === npc.identity.householdId,
    )
    .map((other) => ({
      id: other.id,
      name: other.identity.name,
      trust: getTrust(npc, other.id),
      household: true,
    }));
  const known = npc.social.relationships
    .filter((rel) => !housemates.some((mate) => mate.id === rel.npcId))
    .map((rel) => ({
      id: rel.npcId,
      name: nameOf(rel.npcId),
      trust: rel.trust,
      household: false,
    }));
  return {
    seed: hashString(`${world.seed}:${world.clock.tick}:${npc.id}`),
    tick: world.clock.tick,
    clock: {
      day: world.clock.day,
      minuteOfDay: world.clock.minuteOfDay,
      period: dayPeriod(world),
      shopOpen: isShopOpen(world),
      restDay: isRestDay(world),
      raining: isRaining(world),
      festival: isFestival(world),
    },
    npc: {
      id: npc.id,
      name: npc.identity.name,
      traits: npc.personality,
      needs: { ...npc.needs },
      money: npc.economy.money,
      job: npc.identity.job,
      currentAction: npc.action.type,
      householdId: npc.identity.householdId,
    },
    location: {
      id: location.id,
      name: location.name,
      kind: location.kind,
    },
    nearbyPeople: nearby,
    ties: [...housemates, ...known].slice(0, 8),
    memories: relevantMemories(npc, MEMORY_DECISION_COUNT).map((memory) => ({
      text: memoryTemplate(memory, nameOf),
      importance: memory.importance,
    })),
    availableActions: availableActionsFor(world, npc),
  };
};
