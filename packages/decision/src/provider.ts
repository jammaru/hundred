import type { DecisionResult } from '@hundred/domain';
import type { EngineDecisionContext } from '@hundred/simulation';

export interface DecisionProvider {
  readonly id: 'jev' | 'rules' | 'replay';
  decide(context: EngineDecisionContext, signal?: unknown): Promise<DecisionResult>;
}
