import { describe, expect, it } from 'vitest';

import { clientMessageSchema } from './messages';

describe('protocol', () => {
  it('accepts a pause command', () => {
    const parsed = clientMessageSchema.parse({ type: 'simulation.pause' });
    expect(parsed.type).toBe('simulation.pause');
  });

  it('rejects unknown client messages', () => {
    expect(() => clientMessageSchema.parse({ type: 'hack' })).toThrow();
  });
});
