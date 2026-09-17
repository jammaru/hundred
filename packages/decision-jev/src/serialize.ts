import type { EngineDecisionContext } from '@hundred/simulation';

export const compactDecisionState = (context: EngineDecisionContext) => ({
  person: {
    name: context.npc.name,
    job: context.npc.job,
    traits: context.npc.traits,
    hunger: Math.round(context.npc.needs.hunger),
    energy: Math.round(context.npc.needs.energy),
    health: Math.round(context.npc.needs.health),
    mood: Math.round(context.npc.needs.mood),
    money: context.npc.money,
    doing: context.npc.currentAction,
  },
  time: {
    period: context.clock.period,
    hour: Math.floor(context.clock.minuteOfDay / 60),
    shopOpen: context.clock.shopOpen,
    restDay: context.clock.restDay,
    raining: context.clock.raining,
    festival: context.clock.festival,
  },
  place: context.location,
  nearby: context.nearbyPeople.map((person) => ({
    name: person.name,
    trust: person.trust,
    doing: person.action,
    hungry: person.hunger >= 70,
  })),
  family: context.ties.filter((tie) => tie.household).map((tie) => tie.name),
  memories: context.memories.map((memory) => memory.text),
});

export const actionCriteria = (context: EngineDecisionContext): Record<string, string> => {
  const criteria: Record<string, string> = {};
  for (const action of context.availableActions) {
    criteria[action.type] = action.reason;
  }
  return criteria;
};
