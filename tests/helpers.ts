import { HERO_BODY, type BoxSpec, type CircleSpec, type RoomSpec } from '../src/sim/room';

/** Salle de test vide, 10 par 10, héros au centre. */
export function emptyRoom(overrides: Partial<RoomSpec> = {}): RoomSpec {
  return {
    id: 'test',
    name: 'Salle de test',
    width: 10,
    height: 10,
    seed: 7,
    wallRestitution: 1,
    hero: { ...HERO_BODY, x: 5, y: 5 },
    circles: [],
    boxes: [],
    ...overrides,
  };
}

export function circle(partial: Partial<CircleSpec> & { x: number; y: number }): CircleSpec {
  return { kind: 'dummy', radius: 0.5, mass: 1, restitution: 1, rollingDecel: 0, ...partial };
}

export function box(x: number, y: number, width: number, height: number, restitution = 1): BoxSpec {
  return { x, y, width, height, restitution };
}
