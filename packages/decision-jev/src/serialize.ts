import type { EngineDecisionContext } from '@hundred/simulation';

export const compactTimeState = (context: EngineDecisionContext) => ({
  period: context.clock.period,
  hour: Math.floor(context.clock.minuteOfDay / 60),
  shopOpen: context.clock.shopOpen,
  restDay: context.clock.restDay,
  raining: context.clock.raining,
  festival: context.clock.festival,
});

export const compactPersonState = (context: EngineDecisionContext) => {
  const nearby =
    context.nearbyPeople
      .map((person) => {
        const hungry = person.hunger >= 70 ? ',hungry' : '';
        return `${person.name} (${person.action}, trust ${person.trust}${hungry})`;
      })
      .join('; ') || 'nobody close';
  const family =
    context.ties
      .filter((tie) => tie.household)
      .map((tie) => tie.name)
      .join(', ') || 'none';
  const memories = context.memories.map((memory) => memory.text).join(' | ') || 'none';
  return {
    name: context.npc.name,
    job: context.npc.job,
    kindness: Math.round(context.npc.traits.kindness),
    greed: Math.round(context.npc.traits.greed),
    courage: Math.round(context.npc.traits.courage),
    sociability: Math.round(context.npc.traits.sociability),
    diligence: Math.round(context.npc.traits.diligence),
    hunger: Math.round(context.npc.needs.hunger),
    energy: Math.round(context.npc.needs.energy),
    health: Math.round(context.npc.needs.health),
    mood: Math.round(context.npc.needs.mood),
    money: context.npc.money,
    doing: context.npc.currentAction,
    place: context.location.name,
    placeKind: context.location.kind,
    nearby,
    family,
    memories,
  };
};

export const compactDecisionState = (context: EngineDecisionContext) => ({
  ...compactTimeState(context),
  ...compactPersonState(context),
});

export const actionCriteria = (context: EngineDecisionContext): Record<string, string> => {
  const criteria: Record<string, string> = {};
  for (const action of context.availableActions) {
    criteria[action.type] = action.reason;
  }
  return criteria;
};
