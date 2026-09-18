import { describe, expect, it } from 'vitest';

import { resolveProviderId, type ServerConfig } from './config';

const config = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
  host: '127.0.0.1',
  port: 8787,
  providerMode: 'auto',
  jevApiKey: 'secret',
  worldSeed: 1,
  recordRun: false,
  replayPath: undefined,
  maxConcurrency: 2,
  maxQps: 4,
  batchSize: 8,
  timeoutMs: 4000,
  webRoot: undefined,
  ...overrides,
});

describe('resolveProviderId', () => {
  it('keeps auto and rules on local rules even when a key exists', () => {
    expect(resolveProviderId(config())).toBe('rules');
    expect(resolveProviderId(config({ providerMode: 'rules' }))).toBe('rules');
  });

  it('uses Jev only when the provider is opted in', () => {
    expect(resolveProviderId(config({ providerMode: 'jev' }))).toBe('jev');
    expect(resolveProviderId(config({ providerMode: 'jev', jevApiKey: undefined }))).toBe('rules');
  });
});
