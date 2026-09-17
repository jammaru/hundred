export const JOBS = [
  'farmer',
  'shopkeeper',
  'worker',
  'guard',
  'clinician',
  'bartender',
  'unemployed',
] as const;

export type Job = (typeof JOBS)[number];

export const JOB_LABELS: Record<Job, string> = {
  farmer: 'Farmer',
  shopkeeper: 'Shopkeeper',
  worker: 'Worker',
  guard: 'Guard',
  clinician: 'Clinician',
  bartender: 'Bartender',
  unemployed: 'Unemployed',
};
