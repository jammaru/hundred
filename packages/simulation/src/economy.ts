import { clampInventory, type World } from '@hundred/domain';

import { isScarce } from './clock';

export const foodPrice = (world: World): number => {
  const scarcity = world.shop.foodStock < 40 ? 1.8 : world.shop.foodStock < 80 ? 1.3 : 1;
  return Math.max(1, Math.round(world.shop.basePrice * scarcity));
};

export const totalFood = (world: World): number => {
  const carried = world.npcs.reduce((sum, npc) => sum + npc.economy.inventory.food, 0);
  return world.shop.foodStock + carried;
};

export const averageWealth = (world: World): number => {
  if (world.npcs.length === 0) {
    return 0;
  }
  const total = world.npcs.reduce((sum, npc) => sum + npc.economy.money, 0);
  return Math.round(total / world.npcs.length);
};

export const produceFood = (world: World): void => {
  const farmersWorking = world.npcs.filter(
    (npc) =>
      npc.identity.job === 'farmer' && npc.action.type === 'work' && npc.action.phase === 'acting',
  ).length;
  if (farmersWorking > 0 && world.clock.tick % 12 === 0) {
    const yieldCount = isScarce(world)
      ? Math.max(1, Math.floor(farmersWorking / 2))
      : farmersWorking;
    world.shop.foodStock = clampInventory(world.shop.foodStock + yieldCount);
  }
};
