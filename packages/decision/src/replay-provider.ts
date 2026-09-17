import type { ActionType, DecisionResult } from '@hundred/domain';
import type { EngineDecisionContext } from '@hundred/simulation';

import type { DecisionProvider } from './provider';
import { RulesProvider } from './rules-provider';

export interface RecordedDecision {
  tick: number;
  npcId: string;
  availableActions: ActionType[];
  probabilities: Partial<Record<ActionType, number>>;
  selected: ActionType;
}

export class ReplayProvider implements DecisionProvider {
  readonly id = 'replay' as const;
  private readonly fallback = new RulesProvider();
  private readonly byKey: Map<string, RecordedDecision>;

  constructor(records: readonly RecordedDecision[]) {
    this.byKey = new Map(records.map((record) => [`${record.tick}:${record.npcId}`, record]));
  }

  async decide(context: EngineDecisionContext, signal?: unknown): Promise<DecisionResult> {
    const record =
      this.byKey.get(`${context.tick}:${context.npc.id}`) ??
      [...this.byKey.values()].find(
        (item) => item.npcId === context.npc.id && item.tick <= context.tick,
      );
    if (!record) {
      const result = await this.fallback.decide(context, signal);
      return { ...result, fallback: true };
    }
    const selected = context.availableActions.some((action) => action.type === record.selected)
      ? record.selected
      : (context.availableActions[0]?.type ?? 'idle');
    return {
      selected,
      probabilities: record.probabilities,
      provider: 'replay',
      fallback: selected !== record.selected,
    };
  }
}
