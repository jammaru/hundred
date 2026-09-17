import type { ActionType, DecisionResult } from '@hundred/domain';
import { createRng } from '@hundred/simulation';
import type { EngineDecisionContext } from '@hundred/simulation';

import type { DecisionProvider } from './provider';

const scoreAction = (context: EngineDecisionContext, type: ActionType): number => {
  const { needs, traits, money, job } = context.npc;
  const { period, restDay, shopOpen, raining, festival } = context.clock;
  const night = period === 'night';
  const evening = period === 'evening';
  const workingHours = period === 'morning' || period === 'afternoon' || period === 'midday';
  let score = 0;
  switch (type) {
    case 'eat':
      score = needs.hunger * 1.4;
      break;
    case 'buy_food':
      score = needs.hunger * 1.1 + (money > 10 ? 8 : 0) + (shopOpen ? 6 : -20);
      break;
    case 'steal':
      score = needs.hunger * 0.9 + traits.greed * 0.5 - traits.kindness * 0.45;
      break;
    case 'ask_for_help':
      score = needs.hunger * 0.7 + (100 - traits.courage) * 0.2 + (night ? 8 : 0);
      break;
    case 'work':
      score = 20 + traits.diligence * 0.7 + (needs.hunger < 70 ? 10 : 0);
      if (workingHours && job !== 'bartender') {
        score += 36;
      }
      if (evening && job === 'bartender') {
        score += 42;
      }
      if (night) {
        score -= 40;
      }
      if (restDay && (job === 'farmer' || job === 'worker')) {
        score -= 30;
      }
      break;
    case 'sleep':
      score = (100 - needs.energy) * 1.2 + (night ? 55 : 0);
      break;
    case 'rest':
      score = (100 - needs.energy) * 0.6 + (night ? 12 : 0);
      break;
    case 'talk':
      score = traits.sociability * 0.55 + needs.mood * 0.15 + (evening ? 28 : 0);
      if (night) {
        score -= 18;
      }
      if (restDay) {
        score += 16;
      }
      break;
    case 'visit':
      score = traits.sociability * 0.4 + (evening || restDay ? 24 : 8);
      if (workingHours) {
        score -= 8;
      }
      break;
    case 'help':
      score = traits.kindness * 0.9;
      break;
    case 'fight':
      score = traits.courage * 0.4 + (100 - needs.mood) * 0.2;
      if (night) {
        score -= 10;
      }
      break;
    case 'flee':
      score = 40 + (100 - traits.courage) * 0.4;
      break;
    case 'intervene':
      score = traits.kindness * 0.5 + traits.courage * 0.3;
      break;
    case 'explore':
      score = 18 + traits.courage * 0.15 + (evening ? 12 : 0);
      if (night) {
        score -= 14;
      }
      break;
    case 'idle':
      score = night ? 4 : 8;
      break;
  }
  if (
    needs.hunger >= 80 &&
    (type === 'eat' || type === 'buy_food' || type === 'steal' || type === 'ask_for_help')
  ) {
    score += 55;
  }
  if (raining && (type === 'sleep' || type === 'rest' || type === 'idle')) {
    score += 22;
  }
  if (raining && (type === 'explore' || type === 'work')) {
    score -= 16;
  }
  if (festival && (type === 'talk' || type === 'visit' || type === 'explore')) {
    score += 30;
  }
  return score;
};

const softmaxSample = (
  weights: Array<{ type: ActionType; score: number }>,
  unit: number,
): ActionType => {
  const max = Math.max(...weights.map((item) => item.score));
  const exps = weights.map((item) => ({
    type: item.type,
    value: Math.exp((item.score - max) / 12),
  }));
  const sum = exps.reduce((total, item) => total + item.value, 0);
  let cursor = unit * sum;
  for (const item of exps) {
    cursor -= item.value;
    if (cursor <= 0) {
      return item.type;
    }
  }
  return weights[0]!.type;
};

const targetIdFor = (context: EngineDecisionContext, selected: ActionType): string | undefined => {
  if (selected === 'visit') {
    const family = context.ties.find((tie) => tie.household);
    const closest = [...context.ties].sort((a, b) => b.trust - a.trust)[0];
    return family?.id ?? closest?.id;
  }
  const nearby = context.nearbyPeople.filter((person) => person.action !== 'sleep');
  if (selected === 'fight') {
    return [...nearby].sort((a, b) => a.trust - b.trust)[0]?.id;
  }
  if (selected === 'help' || selected === 'ask_for_help') {
    return [...nearby].sort((a, b) => b.hunger - a.hunger)[0]?.id;
  }
  if (selected === 'talk') {
    const familiar = [...nearby].sort((a, b) => b.trust - a.trust)[0];
    return familiar?.id ?? nearby[0]?.id;
  }
  return nearby[0]?.id ?? context.nearbyPeople[0]?.id;
};

export class RulesProvider implements DecisionProvider {
  readonly id = 'rules' as const;

  decide(context: EngineDecisionContext, signal?: unknown): Promise<DecisionResult> {
    void signal;
    const actions = context.availableActions;
    if (actions.length === 0) {
      return Promise.resolve({
        selected: 'idle',
        probabilities: { idle: 1 },
        provider: 'rules',
        fallback: false,
      });
    }
    const scored = actions.map((action) => ({
      type: action.type,
      score: Math.max(1, scoreAction(context, action.type)),
    }));
    const total = scored.reduce((sum, item) => item.score + sum, 0);
    const probabilities: Partial<Record<ActionType, number>> = {};
    for (const item of scored) {
      probabilities[item.type] = Number((item.score / total).toFixed(4));
    }
    const rng = createRng(context.seed);
    const selected = softmaxSample(scored, rng.next());
    const targetNpcId = targetIdFor(context, selected);
    return Promise.resolve({
      selected,
      probabilities,
      provider: 'rules',
      fallback: false,
      ...(targetNpcId ? { targetNpcId } : {}),
    });
  }
}
