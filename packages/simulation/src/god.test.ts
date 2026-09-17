import { describe, expect, it } from 'vitest';

import { isFestival, isRaining, isShopOpen } from './clock';
import { applyGod } from './god';
import { createWorld } from './world-factory';

describe('god mode', () => {
  it('adds food without scripting a crime', () => {
    const world = createWorld(11, 8);
    world.shop.foodStock = 20;
    const event = applyGod(world, 'add_food');
    expect(event).toMatchObject({ type: 'world_shift', shift: 'food_added' });
    expect(world.shop.foodStock).toBeGreaterThan(20);
  });

  it('starts rain as a condition', () => {
    const world = createWorld(11, 8);
    applyGod(world, 'rain');
    expect(isRaining(world)).toBe(true);
    expect(world.atmosphere.weather).toBe('rain');
  });

  it('opens a festival and clears rain', () => {
    const world = createWorld(11, 8);
    applyGod(world, 'rain');
    applyGod(world, 'festival');
    expect(isFestival(world)).toBe(true);
    expect(world.atmosphere.weather).toBe('clear');
  });

  it('closes the market', () => {
    const world = createWorld(11, 8);
    applyGod(world, 'close_market');
    expect(isShopOpen(world)).toBe(false);
  });

  it('gives money to a selected person', () => {
    const world = createWorld(11, 8);
    const npc = world.npcs[0]!;
    const before = npc.economy.money;
    const event = applyGod(world, 'gift', npc.id);
    expect(event).toMatchObject({ type: 'world_shift', shift: 'gift' });
    expect(npc.economy.money).toBeGreaterThan(before);
  });
});
