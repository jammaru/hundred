import type { ActionType } from '@hundred/domain';
import type { EngineDecisionContext } from '@hundred/simulation';

const AMBIGUOUS: ReadonlySet<ActionType> = new Set([
  'steal',
  'fight',
  'flee',
  'intervene',
  'help',
  'ask_for_help',
]);

/** Call Jev only when the next act is social, moral, or scarce — code handles the rest. */
export const shouldAskJev = (context: EngineDecisionContext): boolean => {
  const types = new Set(context.availableActions.map((action) => action.type));
  for (const type of types) {
    if (AMBIGUOUS.has(type)) {
      return true;
    }
  }
  if (context.clock.festival) {
    return true;
  }
  if (
    context.npc.needs.hunger >= 70 &&
    (types.has('buy_food') || types.has('steal') || types.has('ask_for_help'))
  ) {
    return true;
  }
  if (context.clock.period === 'evening' && types.has('talk') && types.has('work')) {
    return true;
  }
  if (context.nearbyPeople.some((person) => person.hunger >= 70) && types.has('talk')) {
    return true;
  }
  return false;
};
