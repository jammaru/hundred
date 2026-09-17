import type { ActionType } from './actions';

export const DECISION_PROVIDERS = ['jev', 'rules', 'replay'] as const;
export type DecisionProviderId = (typeof DECISION_PROVIDERS)[number];

export const DECISION_STATUSES = ['idle', 'deciding', 'decided'] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export interface DecisionState {
  status: DecisionStatus;
  dueTick: number;
  availableActions: ActionType[];
  probabilities?: Partial<Record<ActionType, number>>;
  selected?: ActionType;
  provider?: DecisionProviderId;
  fallback?: boolean;
}

export interface DecisionResult {
  selected: ActionType;
  probabilities: Partial<Record<ActionType, number>>;
  provider: DecisionProviderId;
  fallback: boolean;
  targetNpcId?: string;
  targetLocationId?: string;
}
