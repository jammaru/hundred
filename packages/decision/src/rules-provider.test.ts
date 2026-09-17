import { createWorld, buildDecisionContext } from '@hundred/simulation';
import { describe, expect, it } from 'vitest';

import { RulesProvider } from './rules-provider';

describe('RulesProvider', () => {
  it('selects an available action', async () => {
    const world = createWorld(9, 12);
    const npc = world.npcs[0]!;
    const context = buildDecisionContext(world, npc);
    const result = await new RulesProvider().decide(context);
    expect(context.availableActions.some((action) => action.type === result.selected)).toBe(true);
    expect(result.provider).toBe('rules');
  });
});
