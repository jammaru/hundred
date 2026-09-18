import { WORLD_BOUNDS, type Npc, type World, type WorldEvent } from '@hundred/domain';
import type { EventCreated, NpcInspected, NpcPublic, ServerMessage } from '@hundred/protocol';
import {
  averageWealth,
  currentActionLabel,
  describeEvent,
  formatMemoryAge,
  isFestival,
  isShopOpen,
  memoryTemplate,
  totalFood,
} from '@hundred/simulation';

const toNpcPublic = (npc: Npc): NpcPublic => ({
  id: npc.id,
  name: npc.identity.name,
  age: npc.identity.age,
  job: npc.identity.job,
  avatarSeed: npc.identity.avatarSeed,
  position: npc.location.position,
  action: npc.action.type,
  phase: npc.action.phase,
  expression: npc.expression,
  hunger: Math.round(npc.needs.hunger),
  energy: Math.round(npc.needs.energy),
  money: npc.economy.money,
  locationId: npc.location.locationId,
  ...(npc.movement ? { movement: npc.movement } : {}),
});

const worldStats = (world: World) => ({
  food: totalFood(world),
  averageWealth: averageWealth(world),
  incidentsToday: world.incidentsToday,
  unemployed: world.npcs.filter((npc) => npc.identity.job === 'unemployed').length,
  helpsToday: world.atmosphere.helpsToday,
  fightsToday: world.atmosphere.fightsToday,
  weather: world.atmosphere.weather,
  shopOpen: isShopOpen(world),
  festival: isFestival(world),
});

export const snapshotMessage = (
  world: World,
  provider: 'jev' | 'rules' | 'replay',
  status: 'running' | 'paused',
  speed: 1 | 2 | 4,
  recording: boolean,
): ServerMessage => ({
  type: 'world.snapshot',
  seed: world.seed,
  engineVersion: world.engineVersion,
  provider,
  status,
  speed,
  tick: world.clock.tick,
  day: world.clock.day,
  minuteOfDay: world.clock.minuteOfDay,
  population: world.npcs.length,
  ...worldStats(world),
  locations: world.locations,
  bounds: WORLD_BOUNDS,
  npcs: world.npcs.map(toNpcPublic),
  recording,
});

export const patchMessage = (world: World): ServerMessage => ({
  type: 'world.patch',
  tick: world.clock.tick,
  day: world.clock.day,
  minuteOfDay: world.clock.minuteOfDay,
  ...worldStats(world),
  npcs: world.npcs.map(toNpcPublic),
});

const npcName = (world: World, id: string | undefined): string | undefined => {
  if (!id) {
    return undefined;
  }
  return world.npcs.find((npc) => npc.id === id)?.identity.name;
};

const eventCategory = (event: WorldEvent): EventCreated['category'] => {
  if (event.type === 'world_shift' && (event.shift === 'aid' || event.shift === 'gift')) {
    return 'help';
  }
  if (event.type === 'fight' || (event.type === 'witness' && event.of === 'fight')) {
    return 'conflict';
  }
  if (event.type === 'help' || (event.type === 'witness' && event.of === 'help')) {
    return 'help';
  }
  if (event.type === 'theft' || event.type === 'witness') {
    return 'crime';
  }
  return 'normal';
};

export const eventMessage = (world: World, event: WorldEvent): EventCreated => {
  const npcIds: string[] = [];
  if ('npcId' in event) {
    npcIds.push(event.npcId);
  }
  if ('targetId' in event) {
    npcIds.push(event.targetId);
  }
  const actorName = 'npcId' in event ? npcName(world, event.npcId) : undefined;
  const targetName = 'targetId' in event ? npcName(world, event.targetId) : undefined;
  const locationId = 'locationId' in event ? event.locationId : undefined;
  const location = locationId ? world.locations.find((item) => item.id === locationId) : undefined;
  return {
    type: 'event.created',
    id: event.id,
    tick: event.tick,
    text: describeEvent(world, event),
    important: Boolean(event.important),
    category: eventCategory(event),
    npcIds,
    kind: event.type,
    ...(actorName ? { actorName } : {}),
    ...(targetName ? { targetName } : {}),
    ...('action' in event ? { action: event.action } : {}),
    ...(locationId ? { locationId } : {}),
    ...(location ? { locationKind: location.kind, locationName: location.name } : {}),
    ...('of' in event ? { of: event.of } : {}),
    ...(event.type === 'world_shift' ? { shift: event.shift } : {}),
    day: world.clock.day,
    minuteOfDay: world.clock.minuteOfDay,
  };
};

export const inspectMessage = (world: World, npc: Npc): NpcInspected => {
  const names = new Map(world.npcs.map((person) => [person.id, person.identity.name] as const));
  const location = world.locations.find((item) => item.id === npc.location.locationId);
  return {
    type: 'npc.inspected',
    npc: {
      id: npc.id,
      name: npc.identity.name,
      age: npc.identity.age,
      job: npc.identity.job,
      avatarSeed: npc.identity.avatarSeed,
      locationName: location?.name ?? 'Town',
      ...(location ? { locationKind: location.kind, locationId: location.id } : {}),
      householdId: npc.identity.householdId,
      actionLabel: currentActionLabel(npc),
      actionType: npc.action.type,
      actionPhase: npc.action.phase,
      expression: npc.expression,
      needs: npc.needs,
      personality: npc.personality,
      money: npc.economy.money,
      relationships: npc.social.relationships.slice(0, 8).map((rel) => ({
        npcId: rel.npcId,
        name: names.get(rel.npcId) ?? 'Unknown',
        trust: rel.trust,
      })),
      memories: npc.social.memories.slice(0, 8).map((memory) => {
        const subjectName = memory.subjectId ? names.get(memory.subjectId) : undefined;
        const targetName = memory.targetId ? names.get(memory.targetId) : undefined;
        return {
          age: formatMemoryAge(memory.tick, world.clock.tick),
          ageMinutes: Math.max(0, world.clock.tick - memory.tick),
          text: memoryTemplate(memory, (id) => names.get(id) ?? 'Someone'),
          memoryType: memory.type,
          ...(subjectName ? { subjectName } : {}),
          ...(targetName ? { targetName } : {}),
        };
      }),
      decision: {
        status: npc.decision.status,
        ...(npc.decision.provider ? { provider: npc.decision.provider } : {}),
        ...(npc.decision.selected ? { selected: npc.decision.selected } : {}),
        ...(npc.decision.probabilities ? { probabilities: npc.decision.probabilities } : {}),
      },
    },
  };
};
