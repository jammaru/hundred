import type { Location, LocationId, Vec2, World } from '@hundred/domain';

export const locationById = (world: World, id: LocationId): Location => {
  const location = world.locations.find((item) => item.id === id);
  if (!location) {
    throw new Error(`Unknown location ${id}`);
  }
  return location;
};

export const locationCenter = (location: Location): Vec2 => ({
  x: location.position.x + location.size.x / 2,
  y: location.position.y + location.size.y / 2,
});

export const distance = (a: Vec2, b: Vec2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
};

export const lerp = (from: Vec2, to: Vec2, t: number): Vec2 => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
});

export const containingLocation = (world: World, position: Vec2): Location => {
  const hit = world.locations.find((location) => {
    return (
      position.x >= location.position.x &&
      position.y >= location.position.y &&
      position.x <= location.position.x + location.size.x &&
      position.y <= location.position.y + location.size.y
    );
  });
  return hit ?? locationById(world, world.locations[0]!.id);
};

export const nearestLocationOfKind = (
  world: World,
  position: Vec2,
  kind: Location['kind'],
): Location => {
  const matches = world.locations.filter((location) => location.kind === kind);
  if (matches.length === 0) {
    return containingLocation(world, position);
  }
  return matches.reduce((best, current) =>
    distance(position, locationCenter(current)) < distance(position, locationCenter(best))
      ? current
      : best,
  );
};
