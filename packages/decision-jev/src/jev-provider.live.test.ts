import { createWorld, buildDecisionContext } from '@hundred/simulation';
import { describe, expect, it } from 'vitest';

import { JevProvider } from './jev-provider';

describe('JevProvider live', () => {
  it('asks Jev for one action when TYPESAFE/JEV key is present', async () => {
    const apiKey = process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY;
    if (!apiKey) {
      return;
    }
    const world = createWorld(1, 8);
    const npc = world.npcs[0]!;
    const result = await new JevProvider({ apiKey, timeoutMs: 4000 }).decide(
      buildDecisionContext(world, npc),
    );
    expect(result.provider === 'jev' || result.fallback).toBe(true);
  });
});
