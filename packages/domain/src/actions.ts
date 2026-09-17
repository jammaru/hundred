export const ACTION_TYPES = [
  'work',
  'eat',
  'sleep',
  'talk',
  'buy_food',
  'help',
  'steal',
  'fight',
  'flee',
  'visit',
  'explore',
  'rest',
  'intervene',
  'idle',
  'ask_for_help',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_LABELS: Record<ActionType, string> = {
  work: 'Work',
  eat: 'Eat',
  sleep: 'Sleep',
  talk: 'Talk',
  buy_food: 'Buy food',
  help: 'Help',
  steal: 'Steal',
  fight: 'Fight',
  flee: 'Flee',
  visit: 'Visit',
  explore: 'Explore',
  rest: 'Rest',
  intervene: 'Intervene',
  idle: 'Idle',
  ask_for_help: 'Ask for help',
};

export const ACTION_PHASES = ['moving', 'acting', 'idle'] as const;
export type ActionPhase = (typeof ACTION_PHASES)[number];

export interface ActiveAction {
  type: ActionType;
  startedTick: number;
  endsTick: number;
  phase: ActionPhase;
  targetNpcId?: string;
  targetLocationId?: string;
}

export interface AvailableAction {
  type: ActionType;
  label: string;
  reason: string;
}
