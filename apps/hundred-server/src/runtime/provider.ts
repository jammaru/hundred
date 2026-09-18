import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { DecisionProvider } from '@hundred/decision';
import { ReplayProvider, RulesProvider, type RecordedDecision } from '@hundred/decision';
import { JevProvider } from '@hundred/decision-jev';
import type { ActionType } from '@hundred/domain';

import { resolveProviderId, type ServerConfig } from '../config';
import type { Logger } from '../logger';

export const createDecisionProvider = (
  config: ServerConfig,
  logger: Logger,
): { provider: DecisionProvider; id: 'jev' | 'rules' | 'replay' } => {
  const id = resolveProviderId(config);
  if (id === 'replay') {
    const records = loadRecords(config.replayPath);
    logger.info('replay started', { path: config.replayPath, records: records.length });
    return { provider: new ReplayProvider(records), id };
  }
  const rules = new RulesProvider();
  if (id === 'jev' && config.jevApiKey) {
    logger.info('provider selected', { provider: 'jev' });
    return {
      provider: new JevProvider({
        apiKey: config.jevApiKey,
        timeoutMs: config.timeoutMs,
        fallback: rules,
      }),
      id,
    };
  }
  logger.info('provider selected', { provider: 'rules' });
  return { provider: rules, id: 'rules' };
};

const loadRecords = (path: string | undefined): RecordedDecision[] => {
  if (!path) {
    return [];
  }
  const file = path.endsWith('.jsonl') ? path : resolve(path, 'decisions.jsonl');
  if (!existsSync(file)) {
    return [];
  }
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RecordedDecision)
    .map((record) => ({
      ...record,
      availableActions: record.availableActions as ActionType[],
      selected: record.selected as ActionType,
    }));
};
