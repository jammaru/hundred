import { clampNeed, WORLD_BOUNDS, type Npc, type World } from '@hundred/domain';

export interface InvariantError {
  npcId?: string;
  message: string;
}

export const assertInvariants = (world: World): InvariantError[] => {
  const errors: InvariantError[] = [];
  for (const npc of world.npcs) {
    const { x, y } = npc.location.position;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x > WORLD_BOUNDS.width ||
      y > WORLD_BOUNDS.height
    ) {
      errors.push({ npcId: npc.id, message: 'position outside world bounds' });
    }
    checkNeed(errors, npc, 'hunger', npc.needs.hunger);
    checkNeed(errors, npc, 'energy', npc.needs.energy);
    checkNeed(errors, npc, 'health', npc.needs.health);
    checkNeed(errors, npc, 'mood', npc.needs.mood);
    if (!Number.isFinite(npc.economy.money) || npc.economy.money < 0) {
      errors.push({ npcId: npc.id, message: 'money is invalid' });
    }
    if (npc.economy.inventory.food < 0) {
      errors.push({ npcId: npc.id, message: 'inventory is negative' });
    }
    for (const relationship of npc.social.relationships) {
      if (relationship.trust < -100 || relationship.trust > 100) {
        errors.push({ npcId: npc.id, message: 'relationship out of range' });
      }
    }
    if (
      npc.decision.selected &&
      npc.decision.availableActions.length > 0 &&
      !npc.decision.availableActions.includes(npc.decision.selected)
    ) {
      errors.push({ npcId: npc.id, message: 'selected action is not available' });
    }
  }
  if (world.shop.foodStock < 0) {
    errors.push({ message: 'shop food is negative' });
  }
  return errors;
};

const checkNeed = (errors: InvariantError[], npc: Npc, key: string, value: number): void => {
  const clamped = clampNeed(value);
  if (clamped !== value) {
    errors.push({ npcId: npc.id, message: `${key} out of range` });
  }
};
