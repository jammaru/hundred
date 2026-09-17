import { MINUTES_PER_DAY, type Job, type World } from '@hundred/domain';

export type DayPeriod = 'night' | 'morning' | 'midday' | 'afternoon' | 'evening';

export const hourOf = (world: World): number => Math.floor(world.clock.minuteOfDay / 60);

export const dayPeriod = (world: World): DayPeriod => {
  const hour = hourOf(world);
  if (hour >= 5 && hour < 11) {
    return 'morning';
  }
  if (hour >= 11 && hour < 14) {
    return 'midday';
  }
  if (hour >= 14 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  return 'night';
};

export const isDaytime = (world: World): boolean => {
  const hour = hourOf(world);
  return hour >= 6 && hour < 20;
};

export const isShopOpen = (world: World): boolean => {
  if (world.atmosphere.shopClosedUntilTick > world.clock.tick) {
    return false;
  }
  const hour = hourOf(world);
  return hour >= 7 && hour < 19;
};

export const isRaining = (world: World): boolean =>
  world.atmosphere.weather === 'rain' && world.atmosphere.rainUntilTick > world.clock.tick;

export const isFestival = (world: World): boolean =>
  world.atmosphere.festivalUntilTick > world.clock.tick;

export const isScarce = (world: World): boolean =>
  world.atmosphere.scarcityUntilTick > world.clock.tick;

export const isRestDay = (world: World): boolean => world.clock.day % 7 === 0;

export const isJobShift = (world: World, job: Job): boolean => {
  const hour = hourOf(world);
  if (job === 'unemployed') {
    return false;
  }
  if (isRestDay(world) && (job === 'farmer' || job === 'worker')) {
    return false;
  }
  if (job === 'farmer') {
    return hour >= 6 && hour < 17;
  }
  if (job === 'shopkeeper') {
    return hour >= 7 && hour < 19;
  }
  if (job === 'worker') {
    return hour >= 8 && hour < 18;
  }
  if (job === 'guard') {
    return hour >= 8 && hour < 20;
  }
  if (job === 'clinician') {
    return hour >= 8 && hour < 18;
  }
  return hour >= 16 && hour < 23;
};

export const formatClock = (world: World): string => {
  const hours = hourOf(world).toString().padStart(2, '0');
  const minutes = (world.clock.minuteOfDay % 60).toString().padStart(2, '0');
  return `Day ${String(world.clock.day).padStart(2, '0')} · ${hours}:${minutes}`;
};

export const advanceClock = (world: World): void => {
  world.clock.tick += 1;
  world.clock.minuteOfDay += 1;
  if (world.clock.minuteOfDay >= MINUTES_PER_DAY) {
    world.clock.minuteOfDay = 0;
    world.clock.day += 1;
    world.incidentsToday = 0;
    world.atmosphere.helpsToday = 0;
    world.atmosphere.fightsToday = 0;
  }
};
