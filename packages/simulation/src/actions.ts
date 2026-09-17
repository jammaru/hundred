import {
  asEventId,
  asLocationId,
  clampInventory,
  clampMoney,
  clampNeed,
  type ActionType,
  type DecisionResult,
  type Npc,
  type World,
  type WorldEvent,
} from '@hundred/domain';

import { dayPeriod, hourOf, isFestival, isRaining } from './clock';
import { foodPrice } from './economy';
import { addMemory } from './memories';
import { nearbyNpcs, startMovement } from './movement';
import { expressionFor } from './needs';
import { adjustTrust, getTrust } from './relationships';
import type { Rng } from './rng';
import { locationById, locationCenter, nearestLocationOfKind } from './space';
import { jobWorkplaceKind } from './world-factory';

const actionDuration: Record<ActionType, number> = {
  idle: 18,
  rest: 24,
  explore: 28,
  eat: 14,
  sleep: 64,
  work: 40,
  buy_food: 22,
  steal: 16,
  talk: 18,
  visit: 32,
  help: 16,
  ask_for_help: 16,
  fight: 14,
  flee: 12,
  intervene: 14,
};

const durationFor = (world: World, type: ActionType): number => {
  const period = dayPeriod(world);
  if (type === 'sleep' && (period === 'night' || period === 'morning')) {
    return period === 'night' ? 90 : 70;
  }
  if (type === 'talk' && period === 'evening') {
    return 24;
  }
  return actionDuration[type];
};

const pushEvent = (world: World, event: WorldEvent): void => {
  world.events.push(event);
  if (world.events.length > 80) {
    world.events = world.events.slice(-80);
  }
};

const eventId = (world: World, suffix: string) =>
  asEventId(`${world.clock.tick}_${suffix}_${world.events.length}`);

const destinationFor = (world: World, npc: Npc, result: DecisionResult) => {
  const period = dayPeriod(world);
  const hour = hourOf(world);
  if (result.selected === 'work') {
    return locationCenter(
      nearestLocationOfKind(world, npc.location.position, jobWorkplaceKind(npc.identity.job)),
    );
  }
  if (result.selected === 'buy_food' || result.selected === 'steal') {
    return locationCenter(nearestLocationOfKind(world, npc.location.position, 'market'));
  }
  if (result.selected === 'sleep') {
    return locationCenter(locationById(world, asLocationId(npc.identity.homeId)));
  }
  if (result.selected === 'explore') {
    if (isFestival(world)) {
      return locationCenter(nearestLocationOfKind(world, npc.location.position, 'plaza'));
    }
    if (isRaining(world) || period === 'night') {
      return locationCenter(locationById(world, asLocationId(npc.identity.homeId)));
    }
    if (period === 'evening') {
      const kind = hour < 23 ? 'tavern' : 'plaza';
      return locationCenter(nearestLocationOfKind(world, npc.location.position, kind));
    }
    if (period === 'midday') {
      return locationCenter(nearestLocationOfKind(world, npc.location.position, 'market'));
    }
    if (npc.identity.job !== 'unemployed') {
      return locationCenter(
        nearestLocationOfKind(world, npc.location.position, jobWorkplaceKind(npc.identity.job)),
      );
    }
    return locationCenter(nearestLocationOfKind(world, npc.location.position, 'park'));
  }
  if (result.targetNpcId) {
    const target = world.npcs.find((person) => person.id === result.targetNpcId);
    if (target) {
      return { x: target.location.position.x + 12, y: target.location.position.y };
    }
  }
  return npc.location.position;
};

const bestFriend = (world: World, npc: Npc): Npc | undefined => {
  const ranked = world.npcs
    .filter((other) => other.id !== npc.id)
    .map((other) => ({
      other,
      trust: getTrust(npc, other.id),
      household: other.identity.householdId === npc.identity.householdId,
    }))
    .sort((a, b) => {
      if (a.household !== b.household) {
        return a.household ? -1 : 1;
      }
      return b.trust - a.trust;
    });
  return ranked[0]?.other;
};

const pickTarget = (world: World, npc: Npc, result: DecisionResult, rng: Rng): Npc | undefined => {
  if (result.selected === 'visit') {
    if (result.targetNpcId) {
      const chosen = world.npcs.find((person) => person.id === result.targetNpcId);
      if (chosen) {
        return chosen;
      }
    }
    return bestFriend(world, npc);
  }
  if (result.targetNpcId) {
    const explicit = world.npcs.find((person) => person.id === result.targetNpcId);
    if (explicit && explicit.action.type !== 'sleep') {
      return explicit;
    }
  }
  const nearby = nearbyNpcs(world, npc).filter((other) => other.action.type !== 'sleep');
  if (nearby.length === 0) {
    return undefined;
  }
  if (result.selected === 'help' || result.selected === 'ask_for_help') {
    return [...nearby].sort((a, b) => b.needs.hunger - a.needs.hunger)[0];
  }
  if (result.selected === 'fight') {
    return [...nearby].sort((a, b) => getTrust(npc, a.id) - getTrust(npc, b.id))[0];
  }
  if (result.selected === 'talk') {
    return [...nearby].sort((a, b) => getTrust(npc, b.id) - getTrust(npc, a.id))[0];
  }
  return rng.pick(nearby);
};

export const beginAction = (
  world: World,
  npc: Npc,
  result: DecisionResult,
  rng: Rng,
): WorldEvent[] => {
  const created: WorldEvent[] = [];
  const target = pickTarget(world, npc, result, rng);
  const duration = durationFor(world, result.selected);
  npc.action = {
    type: result.selected,
    startedTick: world.clock.tick,
    endsTick: world.clock.tick + duration,
    phase: 'moving',
    ...(target ? { targetNpcId: target.id } : {}),
  };
  npc.decision = {
    status: 'decided',
    dueTick: npc.action.endsTick + rng.intRange(20, 90),
    availableActions: result.probabilities
      ? (Object.keys(result.probabilities) as typeof npc.decision.availableActions)
      : [result.selected],
    probabilities: result.probabilities,
    selected: result.selected,
    provider: result.provider,
    fallback: result.fallback,
  };
  const destinationResult = target ? { ...result, targetNpcId: target.id } : result;
  const to = destinationFor(world, npc, destinationResult);
  startMovement(npc, to, world.clock.tick, result.selected === 'flee' ? 78 : 48);
  const event: WorldEvent = {
    id: eventId(world, npc.id),
    tick: world.clock.tick,
    type: 'action_started',
    npcId: npc.id,
    action: result.selected,
  };
  pushEvent(world, event);
  created.push(event);
  npc.expression = expressionFor(npc);
  return created;
};

const gossipMemory = (npc: Npc, listenerId: string) =>
  npc.social.memories.find((memory) => {
    const about = memory.subjectId ?? memory.targetId;
    if (!about || about === listenerId) {
      return false;
    }
    return (
      memory.type === 'witnessed_theft' ||
      memory.type === 'witnessed_fight' ||
      memory.type === 'was_attacked' ||
      memory.type === 'attacked' ||
      memory.type === 'helped' ||
      memory.type === 'stole'
    );
  });

export const resolveAction = (world: World, npc: Npc, rng: Rng): WorldEvent[] => {
  const created: WorldEvent[] = [];
  const action = npc.action.type;
  const target = npc.action.targetNpcId
    ? world.npcs.find((person) => person.id === npc.action.targetNpcId)
    : undefined;

  if (action === 'eat' && npc.economy.inventory.food > 0) {
    npc.economy.inventory.food = clampInventory(npc.economy.inventory.food - 1);
    npc.needs.hunger = clampNeed(npc.needs.hunger - 38);
    npc.needs.mood = clampNeed(npc.needs.mood + 6);
    addMemory(npc, {
      type: 'ate',
      valence: 4,
      importance: 20,
      source: 'direct',
      tick: world.clock.tick,
    });
  }

  if (action === 'rest' || action === 'idle') {
    npc.needs.energy = clampNeed(npc.needs.energy + (action === 'rest' ? 12 : 3));
  }

  if (action === 'sleep') {
    npc.needs.energy = clampNeed(npc.needs.energy + 42);
    npc.needs.health = clampNeed(npc.needs.health + 4);
  }

  if (action === 'work') {
    const wage =
      npc.identity.job === 'unemployed' ? 1 : 8 + Math.round(npc.personality.diligence / 20);
    npc.economy.money = clampMoney(npc.economy.money + wage);
    npc.needs.energy = clampNeed(npc.needs.energy - 10);
    npc.needs.hunger = clampNeed(npc.needs.hunger + 6);
    addMemory(npc, {
      type: 'worked',
      valence: 2,
      importance: 12,
      source: 'direct',
      tick: world.clock.tick,
    });
    if (npc.identity.job === 'clinician') {
      for (const patient of nearbyNpcs(world, npc, 80)) {
        if (patient.needs.health < 82) {
          patient.needs.health = clampNeed(patient.needs.health + 8);
          patient.needs.mood = clampNeed(patient.needs.mood + 2);
        }
      }
    }
  }

  if (action === 'buy_food') {
    const price = foodPrice(world);
    if (npc.economy.money >= price && world.shop.foodStock > 0) {
      npc.economy.money = clampMoney(npc.economy.money - price);
      world.shop.foodStock = clampInventory(world.shop.foodStock - 1);
      npc.economy.inventory.food = clampInventory(npc.economy.inventory.food + 1);
      addMemory(npc, {
        type: 'bought_food',
        valence: 3,
        importance: 18,
        source: 'direct',
        tick: world.clock.tick,
      });
      const event: WorldEvent = {
        id: eventId(world, 'tx'),
        tick: world.clock.tick,
        type: 'transaction',
        npcId: npc.id,
        locationId: nearestLocationOfKind(world, npc.location.position, 'market').id,
        item: 'food',
        cost: price,
      };
      pushEvent(world, event);
      created.push(event);
    }
  }

  if (action === 'steal' && world.shop.foodStock > 0) {
    world.shop.foodStock = clampInventory(world.shop.foodStock - 1);
    npc.economy.inventory.food = clampInventory(npc.economy.inventory.food + 1);
    npc.needs.mood = clampNeed(npc.needs.mood - 4);
    addMemory(npc, {
      type: 'stole',
      valence: -8,
      importance: 70,
      source: 'direct',
      tick: world.clock.tick,
    });
    const witnesses = nearbyNpcs(world, npc, 110);
    for (const witness of witnesses) {
      witness.expression = 'surprised';
      const penalty = witness.identity.job === 'guard' ? -45 : -30;
      adjustTrust(witness, npc.id, penalty);
      addMemory(witness, {
        type: 'witnessed_theft',
        subjectId: npc.id,
        valence: -20,
        importance: 80,
        source: 'direct',
        tick: world.clock.tick,
      });
      const witnessEvent: WorldEvent = {
        id: eventId(world, witness.id),
        tick: world.clock.tick,
        type: 'witness',
        npcId: witness.id,
        targetId: npc.id,
        of: 'theft',
        important: true,
      };
      pushEvent(world, witnessEvent);
      created.push(witnessEvent);
    }
    world.incidentsToday += 1;
    const theft: WorldEvent = {
      id: eventId(world, 'theft'),
      tick: world.clock.tick,
      type: 'theft',
      npcId: npc.id,
      locationId: nearestLocationOfKind(world, npc.location.position, 'market').id,
      witnessedBy: witnesses.map((item) => item.id),
      important: true,
    };
    pushEvent(world, theft);
    created.push(theft);
  }

  if ((action === 'talk' || action === 'visit') && target) {
    const householdBonus = npc.identity.householdId === target.identity.householdId ? 2 : 0;
    adjustTrust(npc, target.id, 2 + householdBonus);
    adjustTrust(target, npc.id, 2 + householdBonus);
    addMemory(npc, {
      type: 'conversation',
      targetId: target.id,
      valence: 3,
      importance: 16,
      source: 'direct',
      tick: world.clock.tick,
    });
    const rumor = gossipMemory(npc, target.id);
    if (rumor && rng.chance(0.55)) {
      const about = rumor.subjectId ?? rumor.targetId;
      if (about) {
        const positive = rumor.type === 'helped';
        addMemory(target, {
          type: 'rumor',
          subjectId: about,
          valence: positive ? 4 : -6,
          importance: 40,
          source: 'rumor',
          tick: world.clock.tick,
        });
        adjustTrust(target, about, positive ? 4 : -8);
      }
    }
    const event: WorldEvent = {
      id: eventId(world, 'talk'),
      tick: world.clock.tick,
      type: 'conversation',
      npcId: npc.id,
      targetId: target.id,
    };
    pushEvent(world, event);
    created.push(event);
  }

  if (action === 'help' && target && npc.economy.inventory.food > 0) {
    npc.economy.inventory.food = clampInventory(npc.economy.inventory.food - 1);
    target.economy.inventory.food = clampInventory(target.economy.inventory.food + 1);
    target.needs.hunger = clampNeed(target.needs.hunger - 20);
    adjustTrust(target, npc.id, 10);
    adjustTrust(npc, target.id, 8);
    addMemory(npc, {
      type: 'helped',
      targetId: target.id,
      valence: 8,
      importance: 60,
      source: 'direct',
      tick: world.clock.tick,
    });
    addMemory(target, {
      type: 'gift',
      subjectId: npc.id,
      valence: 10,
      importance: 70,
      source: 'direct',
      tick: world.clock.tick,
    });
    const event: WorldEvent = {
      id: eventId(world, 'help'),
      tick: world.clock.tick,
      type: 'help',
      npcId: npc.id,
      targetId: target.id,
      important: true,
    };
    pushEvent(world, event);
    created.push(event);
    world.atmosphere.helpsToday += 1;
  }

  if (action === 'ask_for_help' && target) {
    const housemate = target.identity.householdId === npc.identity.householdId;
    const willing =
      target.economy.inventory.food > 0 &&
      (housemate
        ? target.personality.kindness >= 28
        : target.personality.kindness >= 45 || getTrust(target, npc.id) >= 30);
    if (willing) {
      target.economy.inventory.food = clampInventory(target.economy.inventory.food - 1);
      npc.economy.inventory.food = clampInventory(npc.economy.inventory.food + 1);
      adjustTrust(npc, target.id, 10);
      addMemory(npc, {
        type: 'received_help',
        subjectId: target.id,
        valence: 9,
        importance: 64,
        source: 'direct',
        tick: world.clock.tick,
      });
      const event: WorldEvent = {
        id: eventId(world, 'help'),
        tick: world.clock.tick,
        type: 'help',
        npcId: target.id,
        targetId: npc.id,
        important: true,
      };
      pushEvent(world, event);
      created.push(event);
      world.atmosphere.helpsToday += 1;
    } else {
      adjustTrust(npc, target.id, housemate ? -3 : -6);
      addMemory(npc, {
        type: 'refused_help',
        subjectId: target.id,
        valence: -8,
        importance: 40,
        source: 'direct',
        tick: world.clock.tick,
      });
    }
  }

  if (action === 'fight' && target && target.action.type !== 'sleep') {
    adjustTrust(npc, target.id, -50);
    adjustTrust(target, npc.id, -50);
    npc.needs.health = clampNeed(npc.needs.health - rng.intRange(4, 12));
    target.needs.health = clampNeed(target.needs.health - rng.intRange(4, 12));
    npc.expression = 'angry';
    target.expression = 'angry';
    addMemory(npc, {
      type: 'attacked',
      targetId: target.id,
      valence: -18,
      importance: 80,
      source: 'direct',
      tick: world.clock.tick,
    });
    addMemory(target, {
      type: 'was_attacked',
      subjectId: npc.id,
      valence: -22,
      importance: 88,
      source: 'direct',
      tick: world.clock.tick,
    });
    const witnesses = nearbyNpcs(world, npc, 110).slice(0, 2);
    for (const witness of witnesses) {
      if (witness.id === target.id) {
        continue;
      }
      adjustTrust(witness, npc.id, witness.identity.job === 'guard' ? -20 : -12);
      addMemory(witness, {
        type: 'witnessed_fight',
        subjectId: npc.id,
        valence: -14,
        importance: 62,
        source: 'direct',
        tick: world.clock.tick,
      });
      const witnessEvent: WorldEvent = {
        id: eventId(world, witness.id),
        tick: world.clock.tick,
        type: 'witness',
        npcId: witness.id,
        targetId: npc.id,
        of: 'fight',
        important: true,
      };
      pushEvent(world, witnessEvent);
      created.push(witnessEvent);
    }
    world.incidentsToday += 1;
    world.atmosphere.fightsToday += 1;
    const event: WorldEvent = {
      id: eventId(world, 'fight'),
      tick: world.clock.tick,
      type: 'fight',
      npcId: npc.id,
      targetId: target.id,
      important: true,
    };
    pushEvent(world, event);
    created.push(event);
  }

  if (action === 'flee') {
    npc.needs.energy = clampNeed(npc.needs.energy - 6);
    npc.expression = 'afraid';
  }

  npc.action = {
    type: 'idle',
    startedTick: world.clock.tick,
    endsTick: npc.decision.dueTick,
    phase: 'idle',
  };
  npc.expression = expressionFor(npc);
  const completed: WorldEvent = {
    id: eventId(world, 'done'),
    tick: world.clock.tick,
    type: 'action_completed',
    npcId: npc.id,
    action,
  };
  pushEvent(world, completed);
  created.push(completed);
  return created;
};
