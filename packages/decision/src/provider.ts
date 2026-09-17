import type { DecisionResult } from '@hundred/domain';
import type { EngineDecisionContext } from '@hundred/simulation';

export interface DecisionProvider {
  readonly id: 'jev' | 'rules' | 'replay';
  needsModel?: (context: EngineDecisionContext) => boolean;
  decide(context: EngineDecisionContext, signal?: unknown): Promise<DecisionResult>;
  decideMany(contexts: EngineDecisionContext[], signal?: unknown): Promise<DecisionResult[]>;
}
