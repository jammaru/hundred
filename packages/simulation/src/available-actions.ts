import {
  ACTION_LABELS,
  type ActionType,
  type AvailableAction,
  type Npc,
  type World,
} from '@hundred/domain';

import { dayPeriod, isFestival, isJobShift, isRaining, isShopOpen } from './clock';
import { foodPrice } from './economy';
import { nearbyNpcs } from './movement';
import { getTrust } from './relationships';

const action = (type: ActionType, reason: string): AvailableAction => ({
  type,
  label: ACTION_LABELS[type],
  reason,
});

const awakeNearby = (world: World, npc: Npc): Npc[] =>
  nearbyNpcs(world, npc).filter((other) => other.action.type !== 'sleep');

const closestTie = (world: World, npc: Npc): Npc | undefined => {
  const housemate = world.npcs.find(
    (other) => other.id !== npc.id && other.identity.householdId === npc.identity.householdId,
  );
  const friend = [...npc.social.relationships].sort((a, b) => b.trust - a.trust)[0];
  if (friend && friend.trust >= 8) {
    return world.npcs.find((other) => other.id === friend.npcId) ?? housemate;
  }
  return housemate;
};

export const availableActionsFor = (world: World, npc: Npc): AvailableAction[] => {
  const nearby = awakeNearby(world, npc);
  const hungry = npc.needs.hunger >= 55;
  const exhausted = npc.needs.energy <= 35;
  const period = dayPeriod(world);
  const price = foodPrice(world);
  const shopOpen = isShopOpen(world);
  const actions: AvailableAction[] = [
    action('idle', 'Stay put and watch the town.'),
    action('rest', 'Recover a little energy.'),
    action('explore', 'Walk around and see what is happening.'),
  ];
  if (isRaining(world)) {
    actions.push(action('sleep', 'Stay indoors while it rains.'));
  }
  if (isFestival(world)) {
    actions.push(action('talk', 'Join the festival and talk with people.'));
    actions.push(action('explore', 'Go to the plaza for the festival.'));
  }

  if (npc.economy.inventory.food > 0 && npc.needs.hunger >= 25) {
    actions.push(action('eat', 'Eat food you are carrying.'));
  }
  if (hungry && shopOpen && npc.economy.money >= price && world.shop.foodStock > 0) {
    actions.push(action('buy_food', 'Buy food at the market while it is open.'));
  }
  if (hungry && shopOpen && npc.economy.money < price && world.shop.foodStock > 0) {
    actions.push(action('steal', 'Take food without paying because you cannot afford it.'));
  }
  if (exhausted || (period === 'night' && npc.needs.energy <= 70)) {
    actions.push(action('sleep', 'Sleep at home and recover energy.'));
  }
  if (npc.identity.job !== 'unemployed' && isJobShift(world, npc.identity.job)) {
    actions.push(action('work', 'Do your job during your shift and earn money.'));
  }
  if (nearby.length > 0) {
    actions.push(action('talk', 'Talk with someone nearby who is awake.'));
  }
  if (closestTie(world, npc)) {
    actions.push(action('visit', 'Walk over to family or someone you trust.'));
  }
  if (hungry && nearby.length > 0) {
    actions.push(action('ask_for_help', 'Ask a nearby person for food.'));
  }
  const needyFriend = nearby.find(
    (other) =>
      other.needs.hunger >= 70 && npc.economy.inventory.food > 0 && getTrust(npc, other.id) >= -10,
  );
  if (needyFriend) {
    actions.push(action('help', 'Give food to someone who needs it.'));
  }
  const rival = nearby.find((other) => getTrust(npc, other.id) <= -40);
  if (rival && npc.personality.courage >= 40) {
    actions.push(action('fight', 'Confront someone you distrust.'));
  }
  if (nearby.some((other) => other.action.type === 'fight')) {
    actions.push(action('intervene', 'Step in and stop a fight.'));
    actions.push(action('flee', 'Get away from danger.'));
  }
  return uniqueActions(actions);
};

const uniqueActions = (actions: AvailableAction[]): AvailableAction[] => {
  const seen = new Set<ActionType>();
  const unique: AvailableAction[] = [];
  for (const item of actions) {
    if (seen.has(item.type)) {
      continue;
    }
    seen.add(item.type);
    unique.push(item);
  }
  return unique;
};
