import type { DecisionProvider } from '@hundred/decision';
import { RulesProvider } from '@hundred/decision';
import type { ActionType, DecisionResult } from '@hundred/domain';
import type { EngineDecisionContext } from '@hundred/simulation';
import { choice, TypeSafeClient } from '@typesafe-ai/sdk';

import { actionCriteria, compactPersonState, compactTimeState } from './serialize';
import { shouldAskJev } from './should-ask';

export interface JevProviderOptions {
  apiKey: string;
  timeoutMs: number;
  fallback?: DecisionProvider;
}

type JsonRecord = { [key: string]: string | number | boolean | null };

const asState = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as { [key: string]: JsonRecord };

const GUIDANCE =
  'Prefer survival when hunger or energy is critical. Follow the time of day: work during a shift, sleep at night, socialize in the evening. Family and trusted people matter. Personality should influence social and moral choices. Do not invent actions outside the criteria.';

export class JevProvider implements DecisionProvider {
  readonly id = 'jev' as const;
  private readonly client: TypeSafeClient;
  private readonly timeoutMs: number;
  private readonly fallback: DecisionProvider;

  constructor(options: JevProviderOptions) {
    this.client = new TypeSafeClient({
      apiKey: options.apiKey,
      defaultModel: 'jev-latest',
      timeout: options.timeoutMs,
      retry: { maxRetries: 0 },
      logLevel: 'error',
    });
    this.timeoutMs = options.timeoutMs;
    this.fallback = options.fallback ?? new RulesProvider();
  }

  needsModel(context: EngineDecisionContext): boolean {
    return shouldAskJev(context) && Object.keys(actionCriteria(context)).length > 0;
  }

  async decide(context: EngineDecisionContext, signal?: unknown): Promise<DecisionResult> {
    const [result] = await this.decideMany([context], signal);
    return result ?? this.fallback.decide(context, signal);
  }

  async decideMany(contexts: EngineDecisionContext[], signal?: unknown): Promise<DecisionResult[]> {
    const results: Array<DecisionResult | undefined> = Array.from({ length: contexts.length });
    const pending: number[] = [];
    const local: Promise<void>[] = [];
    contexts.forEach((context, index) => {
      if (this.needsModel(context)) {
        pending.push(index);
        return;
      }
      local.push(
        this.fallback.decide(context, signal).then((result) => {
          results[index] = result;
        }),
      );
    });
    if (local.length > 0) {
      await Promise.all(local);
    }
    if (pending.length === 0) {
      return results.map((result, index) => result ?? fallbackIdle(contexts[index]!));
    }
    try {
      const first = contexts[pending[0]!]!;
      const people: Record<string, JsonRecord> = {};
      const questions: Record<string, ReturnType<typeof choice>> = {};
      for (const index of pending) {
        const context = contexts[index]!;
        people[context.npc.id] = compactPersonState(context) as JsonRecord;
        questions[context.npc.id] = choice(
          {
            task: `Choose the next action ${context.npc.name} should take now.`,
            guidance: GUIDANCE,
          },
          actionCriteria(context),
        );
      }
      const response = await this.client.systemOne(
        {
          model: 'jev-latest',
          state: asState({ time: compactTimeState(first), ...people }),
          questions,
        },
        {
          timeout: this.timeoutMs,
          retry: { maxRetries: 0 },
          ...(signal instanceof AbortSignal ? { signal } : {}),
        },
      );
      for (const index of pending) {
        const context = contexts[index]!;
        const answer = response.answers[context.npc.id];
        if (!answer || answer.type !== 'choice') {
          results[index] = {
            ...(await this.fallback.decide(context, signal)),
            fallback: true,
          };
          continue;
        }
        results[index] = fromChoice(context, answer.choice, answer.probabilities);
      }
    } catch {
      await Promise.all(
        pending.map(async (index) => {
          const context = contexts[index]!;
          const result = await this.fallback.decide(context, signal);
          results[index] = { ...result, fallback: true };
        }),
      );
    }
    return results.map((result, index) => result ?? fallbackIdle(contexts[index]!));
  }
}

const fromChoice = (
  context: EngineDecisionContext,
  selectedKey: string,
  raw: Record<string, number>,
): DecisionResult => {
  const selected = toAction(selectedKey, context);
  const probabilities: Partial<Record<ActionType, number>> = {};
  for (const [key, value] of Object.entries(raw)) {
    probabilities[toAction(key, context)] = value;
  }
  return {
    selected,
    probabilities,
    provider: 'jev',
    fallback: false,
    ...(context.nearbyPeople[0] ? { targetNpcId: context.nearbyPeople[0].id } : {}),
  };
};

const toAction = (value: string, context: EngineDecisionContext): ActionType => {
  const match = context.availableActions.find((action) => action.type === value);
  return match?.type ?? context.availableActions[0]?.type ?? 'idle';
};

const fallbackIdle = (context: EngineDecisionContext): DecisionResult => ({
  selected: context.availableActions[0]?.type ?? 'idle',
  probabilities: { idle: 1 },
  provider: 'rules',
  fallback: true,
});
