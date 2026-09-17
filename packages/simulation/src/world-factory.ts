import {
  asLocationId,
  asNpcId,
  ENGINE_VERSION,
  type Job,
  type Location,
  type Npc,
  type World,
} from '@hundred/domain';

import { FIRST_NAMES, LAST_NAMES } from './names';
import { adjustTrust } from './relationships';
import { createRng, type Rng } from './rng';

const JOB_PLAN: Job[] = [
  ...Array.from({ length: 25 }, () => 'farmer' as const),
  ...Array.from({ length: 8 }, () => 'shopkeeper' as const),
  ...Array.from({ length: 25 }, () => 'worker' as const),
  ...Array.from({ length: 8 }, () => 'guard' as const),
  ...Array.from({ length: 6 }, () => 'clinician' as const),
  ...Array.from({ length: 8 }, () => 'bartender' as const),
  ...Array.from({ length: 20 }, () => 'unemployed' as const),
];

const createLocations = (): Location[] => [
  {
    id: asLocationId('plaza'),
    kind: 'plaza',
    name: 'Plaza',
    position: { x: 1400, y: 820 },
    size: { x: 420, y: 320 },
  },
  {
    id: asLocationId('market'),
    kind: 'market',
    name: 'Market',
    position: { x: 1420, y: 420 },
    size: { x: 360, y: 260 },
  },
  {
    id: asLocationId('farm'),
    kind: 'farm',
    name: 'West Farm',
    position: { x: 40, y: 420 },
    size: { x: 640, y: 500 },
  },
  {
    id: asLocationId('farm_south'),
    kind: 'farm',
    name: 'South Fields',
    position: { x: 480, y: 1760 },
    size: { x: 820, y: 380 },
  },
  {
    id: asLocationId('workshop'),
    kind: 'workshop',
    name: 'Workshop',
    position: { x: 60, y: 1460 },
    size: { x: 340, y: 240 },
  },
  {
    id: asLocationId('tavern'),
    kind: 'tavern',
    name: 'Tavern',
    position: { x: 1420, y: 1280 },
    size: { x: 360, y: 260 },
  },
  {
    id: asLocationId('clinic'),
    kind: 'clinic',
    name: 'Clinic',
    position: { x: 1480, y: 40 },
    size: { x: 280, y: 200 },
  },
  {
    id: asLocationId('park'),
    kind: 'park',
    name: 'East Park',
    position: { x: 2320, y: 420 },
    size: { x: 720, y: 520 },
  },
  {
    id: asLocationId('homes_west'),
    kind: 'home',
    name: 'West Homes',
    position: { x: 40, y: 40 },
    size: { x: 540, y: 340 },
  },
  {
    id: asLocationId('homes_north'),
    kind: 'home',
    name: 'North Homes',
    position: { x: 700, y: 40 },
    size: { x: 540, y: 320 },
  },
  {
    id: asLocationId('homes_east'),
    kind: 'home',
    name: 'East Homes',
    position: { x: 2480, y: 40 },
    size: { x: 560, y: 340 },
  },
  {
    id: asLocationId('homes_river'),
    kind: 'home',
    name: 'River Homes',
    position: { x: 40, y: 1120 },
    size: { x: 480, y: 280 },
  },
  {
    id: asLocationId('homes_south'),
    kind: 'home',
    name: 'South Homes',
    position: { x: 1960, y: 1760 },
    size: { x: 640, y: 360 },
  },
];

const workplaceFor = (job: Job): Location['kind'] => {
  if (job === 'farmer') return 'farm';
  if (job === 'shopkeeper') return 'market';
  if (job === 'worker') return 'workshop';
  if (job === 'guard') return 'plaza';
  if (job === 'clinician') return 'clinic';
  if (job === 'bartender') return 'tavern';
  return 'park';
};

const trait = (rng: Rng): number => rng.intRange(12, 92);

const shuffleJobs = (rng: Rng): Job[] => {
  const jobs = [...JOB_PLAN];
  for (let index = jobs.length - 1; index > 0; index -= 1) {
    const swap = rng.int(index + 1);
    const current = jobs[index]!;
    jobs[index] = jobs[swap]!;
    jobs[swap] = current;
  }
  return jobs;
};

const startingMoney = (job: Job, rng: Rng): number => {
  if (job === 'unemployed') return rng.intRange(0, 18);
  if (job === 'farmer') return rng.intRange(8, 40);
  if (job === 'shopkeeper') return rng.intRange(30, 90);
  if (job === 'worker') return rng.intRange(12, 50);
  if (job === 'guard') return rng.intRange(18, 55);
  if (job === 'clinician') return rng.intRange(22, 70);
  return rng.intRange(10, 45);
};

const startingHunger = (job: Job, rng: Rng): number =>
  job === 'unemployed' ? rng.intRange(40, 80) : rng.intRange(18, 62);

export const createWorld = (seed: number, population = 100): World => {
  const rng = createRng(seed);
  const locations = createLocations();
  const homes = locations.filter((location) => location.kind === 'home');
  const jobs = shuffleJobs(rng);
  const usedNames = new Set<string>();
  const npcs: Npc[] = [];
  let created = 0;
  let householdIndex = 0;

  while (created < population) {
    const remaining = population - created;
    const size = remaining <= 4 ? remaining : rng.intRange(2, 4);
    const lastName = LAST_NAMES[householdIndex % LAST_NAMES.length]!;
    const home = homes[householdIndex % homes.length]!;
    const householdId = `hh_${String(householdIndex + 1).padStart(3, '0')}`;
    for (let member = 0; member < size; member += 1) {
      let name = `${rng.pick(FIRST_NAMES)} ${lastName}`;
      while (usedNames.has(name)) {
        name = `${rng.pick(FIRST_NAMES)} ${lastName}`;
      }
      usedNames.add(name);
      const job = jobs[created] ?? 'unemployed';
      const origin = {
        x: home.position.x + rng.intRange(16, Math.max(17, home.size.x - 16)),
        y: home.position.y + rng.intRange(16, Math.max(17, home.size.y - 16)),
      };
      const dueTick = 8 + rng.intRange(0, 70) + created;
      npcs.push({
        id: asNpcId(`npc_${String(created + 1).padStart(3, '0')}`),
        identity: {
          name,
          age: rng.intRange(18, 72),
          avatarSeed: `${seed}:${created}`,
          job,
          homeId: home.id,
          householdId,
        },
        personality: {
          kindness: trait(rng),
          greed: trait(rng),
          courage: trait(rng),
          sociability: trait(rng),
          diligence: trait(rng),
        },
        needs: {
          hunger: startingHunger(job, rng),
          energy: rng.intRange(40, 90),
          health: rng.intRange(70, 100),
          mood: rng.intRange(40, 80),
        },
        economy: {
          money: startingMoney(job, rng),
          inventory: { food: job === 'unemployed' ? rng.intRange(0, 1) : rng.intRange(0, 2) },
        },
        social: {
          relationships: [],
          memories: [],
        },
        location: {
          locationId: home.id,
          position: origin,
        },
        action: {
          type: 'idle',
          startedTick: 0,
          endsTick: dueTick,
          phase: 'idle',
        },
        decision: {
          status: 'idle',
          dueTick,
          availableActions: ['idle'],
        },
        expression: 'neutral',
      });
      created += 1;
    }
    householdIndex += 1;
  }

  for (const npc of npcs) {
    for (const other of npcs) {
      if (npc.id === other.id || npc.identity.householdId !== other.identity.householdId) {
        continue;
      }
      adjustTrust(npc, other.id, 38 + rng.intRange(6, 28));
    }
  }

  const extremes: Array<[keyof Npc['personality'], number]> = [
    ['kindness', 98],
    ['greed', 96],
    ['sociability', 97],
    ['diligence', 97],
    ['courage', 6],
  ];
  const used = new Set<string>();
  for (const [traitName, value] of extremes) {
    const remaining = npcs.filter((npc) => !used.has(npc.id));
    if (remaining.length === 0) {
      break;
    }
    const candidate = rng.pick(remaining);
    candidate.personality[traitName] = value;
    used.add(candidate.id);
  }

  return {
    seed,
    engineVersion: ENGINE_VERSION,
    clock: { tick: 0, minuteOfDay: 8 * 60, day: 1 },
    locations,
    npcs,
    shop: { foodStock: 70, basePrice: 6 },
    atmosphere: {
      weather: 'clear',
      rainUntilTick: 0,
      festivalUntilTick: 0,
      shopClosedUntilTick: 0,
      scarcityUntilTick: 0,
      helpsToday: 0,
      fightsToday: 0,
    },
    events: [],
    incidentsToday: 0,
  };
};

export const jobWorkplaceKind = workplaceFor;
