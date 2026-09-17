import type { DecisionProvider } from '@hundred/decision';
import { RulesProvider } from '@hundred/decision';
import type { ActionType, DecisionResult } from '@hundred/domain';
import type { EngineDecisionContext } from '@hundred/simulation';
import { choice, TypeSafeClient } from '@typesafe-ai/sdk';

import { actionCriteria, compactDecisionState } from './serialize';

export interface JevProviderOptions {
  apiKey: string;
  timeoutMs: number;
  fallback?: DecisionProvider;
}

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

  async decide(context: EngineDecisionContext, signal?: unknown): Promise<DecisionResult> {
    const criteria = actionCriteria(context);
    if (Object.keys(criteria).length === 0) {
      return this.fallback.decide(context, signal);
    }

    try {
      const response = await this.client.systemOne(
        {
          model: 'jev-latest',
          state: JSON.parse(JSON.stringify(compactDecisionState(context))) as {
            [key: string]: { [key: string]: string | number | boolean | null };
          },
          questions: {
            nextAction: choice(
              {
                task: 'Choose the next action this person should take now.',
                guidance:
                  'Prefer survival when hunger or energy is critical. Follow the time of day: work during a shift, sleep at night, socialize in the evening. Family and trusted people matter. Personality should influence social and moral choices. Do not invent actions outside the criteria.',
              },
              criteria,
            ),
          },
        },
        {
          timeout: this.timeoutMs,
          retry: { maxRetries: 0 },
          ...(signal instanceof AbortSignal ? { signal } : {}),
        },
      );
      const answer = response.answers.nextAction;
      const selected = toAction(answer.choice, context);
      const probabilities: Partial<Record<ActionType, number>> = {};
      for (const [key, value] of Object.entries(answer.probabilities)) {
        const action = toAction(key, context);
        probabilities[action] = value;
      }
      return {
        selected,
        probabilities,
        provider: 'jev',
        fallback: false,
        ...(context.nearbyPeople[0] ? { targetNpcId: context.nearbyPeople[0].id } : {}),
      };
    } catch {
      const result = await this.fallback.decide(context, signal);
      return { ...result, fallback: true };
    }
  }
}

const toAction = (value: string, context: EngineDecisionContext): ActionType => {
  const match = context.availableActions.find((action) => action.type === value);
  return match?.type ?? context.availableActions[0]?.type ?? 'idle';
};
