import { clampNeed, type Npc, type World } from '@hundred/domain';

export const decayNeeds = (world: World): void => {
  for (const npc of world.npcs) {
    const working = npc.action.type === 'work' && npc.action.phase === 'acting';
    const sleeping = npc.action.type === 'sleep' && npc.action.phase === 'acting';
    npc.needs.hunger = clampNeed(npc.needs.hunger + (sleeping ? 0.03 : working ? 0.14 : 0.08));
    if (sleeping) {
      npc.needs.energy = clampNeed(npc.needs.energy + 0.16);
    } else {
      npc.needs.energy = clampNeed(npc.needs.energy - (working ? 0.09 : 0.05));
    }
    if (npc.needs.hunger > 90 || npc.needs.energy < 10) {
      npc.needs.health = clampNeed(npc.needs.health - 0.04);
      npc.needs.mood = clampNeed(npc.needs.mood - 0.06);
    } else if (npc.needs.hunger < 30 && npc.needs.energy > 60) {
      npc.needs.health = clampNeed(npc.needs.health + 0.02);
      npc.needs.mood = clampNeed(npc.needs.mood + 0.02);
    }
  }
};

export const expressionFor = (npc: Npc): Npc['expression'] => {
  if (npc.action.type === 'fight') {
    return 'angry';
  }
  if (npc.action.type === 'flee') {
    return 'afraid';
  }
  if (npc.action.type === 'sleep' || npc.needs.energy < 18) {
    return 'tired';
  }
  if (npc.action.type === 'help' || npc.needs.mood > 75) {
    return 'happy';
  }
  if (npc.needs.mood < 25 || npc.needs.hunger > 85) {
    return 'sad';
  }
  return 'neutral';
};
