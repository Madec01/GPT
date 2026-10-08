/**
 * Description d'une salle et construction du monde ECS correspondant.
 *
 * Les coordonnées sont en unités d'arène, origine en haut à gauche, y vers le
 * bas. Les limites de l'arène sont quatre segments solides. Chaque boîte reçoit
 * quatre segments enfants ; la boîte elle-même sert au rendu et aux règles.
 */
import { World, type Entity } from '../core/ecs/world';
import { BoxShape, CircleBody, SegmentBody, SegmentOwner, Transform, Velocity } from '../core/physics';
import { Kind } from './components';

export interface BodySpec {
  x: number;
  y: number;
  radius: number;
  mass: number;
  restitution: number;
  rollingDecel: number;
}

export interface CircleSpec extends BodySpec {
  kind: string;
}

export interface BoxSpec {
  /** Centre de la boîte. */
  x: number;
  y: number;
  width: number;
  height: number;
  restitution: number;
}

export interface RoomSpec {
  id: string;
  name: string;
  width: number;
  height: number;
  seed: number;
  wallRestitution: number;
  hero: BodySpec;
  circles: readonly CircleSpec[];
  boxes: readonly BoxSpec[];
}

export interface BuiltRoom {
  world: World;
  hero: Entity;
}

/** Paramètres physiques du héros, valeurs initiales du GDD. */
export const HERO_BODY: Omit<BodySpec, 'x' | 'y'> = {
  radius: 0.5,
  mass: 1,
  restitution: 0.7,
  rollingDecel: 6,
};

export function buildRoom(spec: RoomSpec): BuiltRoom {
  const world = new World();

  const hero = addCircle(world, { ...spec.hero, kind: 'hero' });
  for (const circle of spec.circles) addCircle(world, circle);

  addBounds(world, spec);
  for (const box of spec.boxes) addBox(world, box);

  return { world, hero };
}

function addCircle(world: World, spec: CircleSpec): Entity {
  const entity = world.create();
  world.add(entity, Kind, { kind: spec.kind });
  world.add(entity, Transform, { x: spec.x, y: spec.y });
  world.add(entity, Velocity, { x: 0, y: 0 });
  world.add(entity, CircleBody, {
    radius: spec.radius,
    mass: spec.mass,
    restitution: spec.restitution,
    rollingDecel: spec.rollingDecel,
  });
  return entity;
}

function addSegment(world: World, ax: number, ay: number, bx: number, by: number, restitution: number, owner?: Entity): Entity {
  const entity = world.create();
  world.add(entity, SegmentBody, { ax, ay, bx, by, restitution });
  if (owner !== undefined) world.add(entity, SegmentOwner, { owner });
  return entity;
}

function addBounds(world: World, spec: RoomSpec): void {
  const { width: w, height: h, wallRestitution: e } = spec;
  addSegment(world, 0, 0, w, 0, e);
  addSegment(world, w, 0, w, h, e);
  addSegment(world, w, h, 0, h, e);
  addSegment(world, 0, h, 0, 0, e);
}

function addBox(world: World, box: BoxSpec): Entity {
  const entity = world.create();
  world.add(entity, Kind, { kind: 'box' });
  world.add(entity, Transform, { x: box.x, y: box.y });
  world.add(entity, BoxShape, { halfWidth: box.width / 2, halfHeight: box.height / 2 });
  const l = box.x - box.width / 2;
  const r = box.x + box.width / 2;
  const t = box.y - box.height / 2;
  const b = box.y + box.height / 2;
  addSegment(world, l, t, r, t, box.restitution, entity);
  addSegment(world, r, t, r, b, box.restitution, entity);
  addSegment(world, r, b, l, b, box.restitution, entity);
  addSegment(world, l, b, l, t, box.restitution, entity);
  return entity;
}
