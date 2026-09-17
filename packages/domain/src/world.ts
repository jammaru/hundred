import type { WorldEvent } from './events';
import type { Location } from './location';
import type { Npc } from './npc';

export interface ShopState {
  foodStock: number;
  basePrice: number;
}

export interface WorldClock {
  tick: number;
  minuteOfDay: number;
  day: number;
}

export type Weather = 'clear' | 'rain';

export interface WorldAtmosphere {
  weather: Weather;
  rainUntilTick: number;
  festivalUntilTick: number;
  shopClosedUntilTick: number;
  scarcityUntilTick: number;
  helpsToday: number;
  fightsToday: number;
}

export interface World {
  seed: number;
  engineVersion: string;
  clock: WorldClock;
  locations: Location[];
  npcs: Npc[];
  shop: ShopState;
  atmosphere: WorldAtmosphere;
  events: WorldEvent[];
  incidentsToday: number;
}

export const ENGINE_VERSION = '0.2.0';
export const DEFAULT_POPULATION = 100;
