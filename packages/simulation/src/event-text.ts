import type { Npc, World, WorldEvent } from '@hundred/domain';

const nameOf = (world: World, id: string): string =>
  world.npcs.find((npc) => npc.id === id)?.identity.name ?? 'Someone';

export const describeEvent = (world: World, event: WorldEvent): string => {
  switch (event.type) {
    case 'action_started':
      return `${nameOf(world, event.npcId)} started ${event.action.replaceAll('_', ' ')}.`;
    case 'action_completed':
      return `${nameOf(world, event.npcId)} finished ${event.action.replaceAll('_', ' ')}.`;
    case 'theft':
      return `${nameOf(world, event.npcId)} stole food from the Market.`;
    case 'witness':
      if (event.of === 'fight') {
        return `${nameOf(world, event.npcId)} witnessed ${nameOf(world, event.targetId)} fighting.`;
      }
      if (event.of === 'help') {
        return `${nameOf(world, event.npcId)} witnessed ${nameOf(world, event.targetId)} helping someone.`;
      }
      return `${nameOf(world, event.npcId)} witnessed ${nameOf(world, event.targetId)} stealing.`;
    case 'fight':
      return `${nameOf(world, event.npcId)} attacked ${nameOf(world, event.targetId)}.`;
    case 'help':
      return `${nameOf(world, event.npcId)} gave food to ${nameOf(world, event.targetId)}.`;
    case 'conversation':
      return `${nameOf(world, event.npcId)} talked with ${nameOf(world, event.targetId)}.`;
    case 'transaction':
      return `${nameOf(world, event.npcId)} bought food.`;
    case 'relationship_changed':
      return `${nameOf(world, event.npcId)} now trusts ${nameOf(world, event.targetId)} at ${event.trust}.`;
    case 'memory_created':
      return `${nameOf(world, event.npcId)} formed a memory.`;
    case 'world_shift':
      return describeShift(world, event.shift, event.npcId);
  }
};

const describeShift = (world: World, shift: string, npcId?: string): string => {
  const name = npcId ? nameOf(world, npcId) : 'Someone';
  switch (shift) {
    case 'food_added':
      return 'Food arrived in the market.';
    case 'food_taken':
      return 'The town is running short of food.';
    case 'rain':
      return 'Rain began to fall over the town.';
    case 'festival':
      return 'A festival started in the plaza.';
    case 'market_closed':
      return 'The market closed its doors.';
    case 'gift':
      return `${name} received money.`;
    case 'aid':
      return `${name} received help.`;
    default:
      return 'The town changed.';
  }
};

export const currentActionLabel = (npc: Npc): string => {
  if (npc.decision.status === 'deciding') {
    return 'Deciding';
  }
  if (npc.action.phase === 'moving') {
    return `Walking to ${npc.action.type.replaceAll('_', ' ')}`;
  }
  if (npc.action.type === 'idle') {
    return 'Idle';
  }
  return npc.action.type.replaceAll('_', ' ');
};
