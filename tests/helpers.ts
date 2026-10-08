import { World } from '../src/core/ecs/world';
import { addBounds, addBox, addDynamicCircle, HERO_BODY, type BodySpec, type BoxSpec } from '../src/sim/room';
import { DEFAULT_SIM, Simulation, type SimConfig } from '../src/sim/simulation';

/** Héros sans décélération de roulement, pour isoler les rebonds. */
export const NO_DECEL: Omit<BodySpec, 'x' | 'y'> = { ...HERO_BODY, rollingDecel: 0 };

export interface BodiesSpec {
  width?: number;
  height?: number;
  wallRestitution?: number;
  hero: BodySpec;
  circles?: readonly BodySpec[];
  boxes?: readonly BoxSpec[];
}

/** Simulation de physique pure, sans règles de jeu, à partir de corps explicites. */
export function simFromBodies(spec: BodiesSpec, config: SimConfig = DEFAULT_SIM): Simulation {
  const world = new World();
  const hero = addDynamicCircle(world, 'hero', spec.hero);
  for (const c of spec.circles ?? []) addDynamicCircle(world, 'dummy', c);
  addBounds(world, spec.width ?? 10, spec.height ?? 10, spec.wallRestitution ?? 1);
  for (const b of spec.boxes ?? []) addBox(world, b);
  return new Simulation(world, hero, config);
}

export function circle(partial: Partial<BodySpec> & { x: number; y: number }): BodySpec {
  return { radius: 0.5, mass: 1, restitution: 1, rollingDecel: 0, ...partial };
}

export function box(x: number, y: number, width: number, height: number, restitution = 1): BoxSpec {
  return { x, y, width, height, restitution };
}
