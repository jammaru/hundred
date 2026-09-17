import { describe, expect, it } from 'vitest';

import { availableActionsFor } from './available-actions';
import { dayPeriod, isJobShift, isShopOpen } from './clock';
import { createWorld } from './world-factory';

describe('clock periods', () => {
  it('treats 08:00 as morning with an open shop', () => {
    const world = createWorld(1, 8);
    expect(dayPeriod(world)).toBe('morning');
    expect(isShopOpen(world)).toBe(true);
  });

  it('closes the shop at night', () => {
    const world = createWorld(1, 8);
    world.clock.minuteOfDay = 22 * 60;
    expect(dayPeriod(world)).toBe('night');
    expect(isShopOpen(world)).toBe(false);
  });
});

describe('households', () => {
  it('groups people into households that share a last name', () => {
    const world = createWorld(3, 20);
    const groups = new Map<string, string[]>();
    for (const npc of world.npcs) {
      const names = groups.get(npc.identity.householdId) ?? [];
      names.push(npc.identity.name);
      groups.set(npc.identity.householdId, names);
    }
    expect(groups.size).toBeGreaterThan(1);
    for (const names of groups.values()) {
      const lastName = names[0]!.split(' ').at(-1);
      expect(names.every((name) => name.endsWith(` ${lastName}`))).toBe(true);
      expect(names.length).toBeGreaterThanOrEqual(1);
      expect(names.length).toBeLessThanOrEqual(4);
    }
  });

  it('seeds household trust', () => {
    const world = createWorld(3, 12);
    const npc = world.npcs[0]!;
    const family = world.npcs.filter(
      (other) => other.id !== npc.id && other.identity.householdId === npc.identity.householdId,
    );
    expect(family.length).toBeGreaterThan(0);
    expect(npc.social.relationships.length).toBeGreaterThan(0);
  });
});

describe('available actions', () => {
  it('does not offer buy_food when the shop is closed', () => {
    const world = createWorld(1, 8);
    world.clock.minuteOfDay = 22 * 60;
    const hungry = world.npcs[0]!;
    hungry.needs.hunger = 80;
    hungry.economy.money = 50;
    const actions = availableActionsFor(world, hungry);
    expect(actions.some((action) => action.type === 'buy_food')).toBe(false);
  });

  it('keeps farmers off-shift at night', () => {
    const world = createWorld(1, 8);
    world.clock.minuteOfDay = 23 * 60;
    expect(isJobShift(world, 'farmer')).toBe(false);
  });
});

describe('town scale', () => {
  it('spreads households across a larger map', () => {
    const world = createWorld(7, 100);
    const homes = world.locations.filter((location) => location.kind === 'home');
    expect(homes.length).toBeGreaterThanOrEqual(5);
    const homeIds = new Set(world.npcs.map((npc) => npc.identity.homeId));
    expect(homeIds.size).toBeGreaterThanOrEqual(4);
    const maxX = Math.max(
      ...world.locations.map((location) => location.position.x + location.size.x),
    );
    const maxY = Math.max(
      ...world.locations.map((location) => location.position.y + location.size.y),
    );
    expect(maxX).toBeGreaterThan(2800);
    expect(maxY).toBeGreaterThan(1900);
  });
});
