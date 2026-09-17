import type { LocationId } from './ids';

const LOCATION_KINDS = [
  'home',
  'farm',
  'market',
  'workshop',
  'tavern',
  'clinic',
  'plaza',
  'park',
] as const;

export type LocationKind = (typeof LOCATION_KINDS)[number];

export interface Vec2 {
  x: number;
  y: number;
}

export interface WorldBounds {
  width: number;
  height: number;
}

export interface Location {
  id: LocationId;
  kind: LocationKind;
  name: string;
  position: Vec2;
  size: Vec2;
}

export interface NpcLocation {
  locationId: LocationId;
  position: Vec2;
}

export interface MovementIntent {
  from: Vec2;
  to: Vec2;
  startTick: number;
  durationTicks: number;
}

export const WORLD_BOUNDS: WorldBounds = {
  width: 1600,
  height: 1000,
};

export const SIMULATION_TICK_MS = 100;
export const TICKS_PER_GAME_MINUTE = 1;
export const MINUTES_PER_DAY = 24 * 60;
