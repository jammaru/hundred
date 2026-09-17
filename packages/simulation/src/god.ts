import {
  asEventId,
  clampInventory,
  clampMoney,
  clampNeed,
  type NpcId,
  type World,
  type WorldEvent,
} from '@hundred/domain';

const GOD_INTENTS = [
  'add_food',
  'starve',
  'rain',
  'festival',
  'close_market',
  'gift',
  'aid',
] as const;

export type GodIntent = (typeof GOD_INTENTS)[number];

const shiftEvent = (
  world: World,
  shift: Extract<WorldEvent, { type: 'world_shift' }>['shift'],
  npcId?: NpcId,
): WorldEvent => ({
  id: asEventId(`${world.clock.tick}_god_${shift}`),
  tick: world.clock.tick,
  type: 'world_shift',
  shift,
  important: true,
  ...(npcId ? { npcId } : {}),
});

export const applyGod = (world: World, intent: GodIntent, npcId?: string): WorldEvent => {
  const until = world.clock.tick + 240;
  if (intent === 'add_food') {
    world.shop.foodStock = clampInventory(world.shop.foodStock + 50);
    world.atmosphere.scarcityUntilTick = 0;
    return shiftEvent(world, 'food_added');
  }
  if (intent === 'starve') {
    world.shop.foodStock = clampInventory(Math.max(4, world.shop.foodStock - 50));
    world.atmosphere.scarcityUntilTick = until + 120;
    return shiftEvent(world, 'food_taken');
  }
  if (intent === 'rain') {
    world.atmosphere.weather = 'rain';
    world.atmosphere.rainUntilTick = until;
    return shiftEvent(world, 'rain');
  }
  if (intent === 'festival') {
    world.atmosphere.festivalUntilTick = until;
    world.atmosphere.weather = 'clear';
    world.atmosphere.rainUntilTick = 0;
    return shiftEvent(world, 'festival');
  }
  if (intent === 'close_market') {
    world.atmosphere.shopClosedUntilTick = world.clock.tick + 180;
    return shiftEvent(world, 'market_closed');
  }
  const npc = npcId ? world.npcs.find((person) => person.id === npcId) : undefined;
  if (intent === 'gift' && npc) {
    npc.economy.money = clampMoney(npc.economy.money + 30);
    npc.needs.mood = clampNeed(npc.needs.mood + 8);
    return shiftEvent(world, 'gift', npc.id);
  }
  if (intent === 'aid' && npc) {
    npc.economy.money = clampMoney(npc.economy.money + 12);
    npc.economy.inventory.food = clampInventory(npc.economy.inventory.food + 1);
    npc.needs.hunger = clampNeed(npc.needs.hunger - 32);
    npc.needs.mood = clampNeed(npc.needs.mood + 12);
    npc.needs.energy = clampNeed(npc.needs.energy + 10);
    return shiftEvent(world, 'aid', npc.id);
  }
  return shiftEvent(world, 'food_added');
};

export const expireAtmosphere = (world: World): void => {
  if (world.atmosphere.rainUntilTick <= world.clock.tick) {
    world.atmosphere.weather = 'clear';
  }
};
