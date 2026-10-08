/**
 * Description d'une salle et construction du monde ECS correspondant.
 *
 * Les coordonnées sont en unités d'arène, origine en haut à gauche, y vers le
 * bas, le diamètre du héros vaut 1. Les limites de l'arène sont quatre
 * segments solides. Chaque boîte reçoit quatre segments enfants ; la boîte
 * elle-même sert au rendu et aux règles de casse.
 */
import { World, type Entity } from '../core/ecs/world';
import { BoxShape, CircleBody, SegmentBody, SegmentOwner, Transform, Velocity } from '../core/physics';
import { ENEMIES, PUSHABLES, RULES, type Archetype, type EnemyRole, type PushableKind } from './archetypes';
import type { ContractSpec } from './contracts';
import {
  Breakable,
  type BreakableKind,
  Enemy,
  Hazard,
  Hero,
  Kind,
  Pushable,
  RoomState,
  Springboard,
  type HeroElement,
  type HeroForm,
  type Objective,
} from './components';
import { rect, type Zone } from './zones';

export interface BodySpec {
  x: number;
  y: number;
  radius: number;
  mass: number;
  restitution: number;
  rollingDecel: number;
}

export interface EnemySpec {
  archetype: Archetype;
  x: number;
  y: number;
  shield?: boolean;
  role?: EnemyRole;
}

export interface PushableSpec {
  kind: PushableKind;
  x: number;
  y: number;
}

export interface BoxSpec {
  /** Centre de la boîte. */
  x: number;
  y: number;
  width: number;
  height: number;
  restitution?: number;
  breakable?: BreakableKind;
  /** Zone d'éboulement d'une colonne. */
  collapse?: Zone;
  /** Ressort : ce qui le touche repart plus vite. */
  bouncy?: boolean;
}

export interface SpringboardSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  dirX: number;
  dirY: number;
  impulse?: number;
}

export interface HazardSpec {
  kind: 'pit';
  zone: Zone;
}

export type ObjectiveSpec =
  | { type: 'eliminate' }
  | { type: 'push'; object: number; goal: { x: number; y: number; r: number } };

export interface RoomSpec {
  id: string;
  name: string;
  width: number;
  height: number;
  seed: number;
  wallRestitution: number;
  hero: { x: number; y: number };
  enemies: readonly EnemySpec[];
  pushables: readonly PushableSpec[];
  boxes: readonly BoxSpec[];
  springboards: readonly SpringboardSpec[];
  hazards: readonly HazardSpec[];
  objective: ObjectiveSpec;
  /** Points de vie rendus en entrant, salle de récupération. */
  healOnEnter?: number;
  /** Contrat secondaire optionnel, évalué à la victoire. */
  contract?: ContractSpec;
  /** Récompense à la sortie : le choix d'une forme, ou l'élément. */
  reward?: 'forme' | 'element';
}

/** État du héros transporté d'une salle à l'autre. */
export interface HeroCarry {
  hp: number;
  charge: number;
  form: HeroForm;
  element: HeroElement;
}

export const DEFAULT_CARRY: HeroCarry = { hp: RULES.heroMaxHp, charge: 0, form: 'none', element: 'none' };

export interface BuiltRoom {
  world: World;
  hero: Entity;
  room: Entity;
}

/** Paramètres physiques du héros, valeurs initiales du GDD. */
export const HERO_BODY: Omit<BodySpec, 'x' | 'y'> = {
  radius: 0.5,
  mass: 1,
  restitution: 0.7,
  rollingDecel: 6,
};

const DEFAULT_BOX_RESTITUTION = 0.5;

export function buildRoom(spec: RoomSpec, carry: HeroCarry = DEFAULT_CARRY): BuiltRoom {
  const world = new World();

  const room = world.create();
  const hero = addDynamicCircle(world, 'hero', { ...HERO_BODY, x: spec.hero.x, y: spec.hero.y });
  const hp = Math.min(RULES.heroMaxHp, carry.hp + (spec.healOnEnter ?? 0));
  world.add(hero, Hero, {
    hp,
    maxHp: RULES.heroMaxHp,
    brakeAvailable: true,
    charge: carry.charge,
    chargeMax: RULES.chargeMax,
    form: carry.form,
    element: carry.element,
    strongThrow: false,
    anchored: false,
    anchoredOnEnemy: false,
    strongPassUsed: false,
    throwOriginX: spec.hero.x,
    throwOriginY: spec.hero.y,
    lastContactStep: 0,
  });

  for (const e of spec.enemies) addEnemy(world, e);
  const pushables = spec.pushables.map((p) => addPushable(world, p));

  addBounds(world, spec.width, spec.height, spec.wallRestitution);
  for (const box of spec.boxes) addBox(world, box);
  for (const s of spec.springboards) addSpringboard(world, s);
  for (const h of spec.hazards) addHazard(world, h);

  world.add(room, RoomState, {
    turn: 0,
    phase: 'aim',
    rngState: spec.seed >>> 0,
    objective: toObjective(spec.objective, pushables),
    log: [],
    heroHits: 0,
    breaks: 0,
    bestStuns: 0,
    contract: spec.contract ?? null,
    contractDone: null,
    placedBoxes: {},
  });

  return { world, hero, room };
}

function toObjective(spec: ObjectiveSpec, pushables: readonly Entity[]): Objective {
  if (spec.type === 'eliminate') return { type: 'eliminate' };
  const object = pushables[spec.object];
  if (object === undefined) throw new Error(`Objectif : objet poussable ${spec.object} inexistant`);
  return { type: 'push', object, goal: { kind: 'disc', x: spec.goal.x, y: spec.goal.y, r: spec.goal.r } };
}

export function addDynamicCircle(world: World, kind: string, spec: BodySpec): Entity {
  const entity = world.create();
  world.add(entity, Kind, { kind });
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

function addEnemy(world: World, spec: EnemySpec): Entity {
  const profile = ENEMIES[spec.archetype];
  const entity = addDynamicCircle(world, spec.archetype, { ...profile, x: spec.x, y: spec.y });
  world.add(entity, Enemy, {
    archetype: spec.archetype,
    turnStartX: spec.x,
    turnStartY: spec.y,
    stunned: false,
    intent: null,
    cycleIndex: 0,
    role: spec.role ?? 'none',
    shield: spec.shield ?? false,
    shieldX: 0,
    shieldY: 1,
  });
  world.add(entity, Health, { hp: profile.hp, max: profile.hp });
  return entity;
}

function addPushable(world: World, spec: PushableSpec): Entity {
  const profile = PUSHABLES[spec.kind];
  const entity = addDynamicCircle(world, spec.kind, { ...profile, x: spec.x, y: spec.y });
  world.add(entity, Pushable, { pushableKind: spec.kind, startX: spec.x, startY: spec.y });
  return entity;
}

export function addSegment(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  restitution: number,
  owner?: Entity,
): Entity {
  const entity = world.create();
  world.add(entity, SegmentBody, { ax, ay, bx, by, restitution });
  if (owner !== undefined) world.add(entity, SegmentOwner, { owner });
  return entity;
}

export function addBounds(world: World, width: number, height: number, restitution: number): void {
  addSegment(world, 0, 0, width, 0, restitution);
  addSegment(world, width, 0, width, height, restitution);
  addSegment(world, width, height, 0, height, restitution);
  addSegment(world, 0, height, 0, 0, restitution);
}

export function addBox(world: World, box: BoxSpec): Entity {
  const entity = world.create();
  world.add(entity, Kind, { kind: box.breakable ?? (box.bouncy ? 'ressort' : 'box') });
  world.add(entity, Transform, { x: box.x, y: box.y });
  world.add(entity, BoxShape, { halfWidth: box.width / 2, halfHeight: box.height / 2 });
  if (box.breakable) {
    const solidity = RULES.solidity[box.breakable] ?? 1;
    world.add(entity, Breakable, { breakableKind: box.breakable, collapse: box.collapse ?? null, solidity, maxSolidity: solidity });
  }
  const e = box.restitution ?? (box.bouncy ? RULES.springRestitution : DEFAULT_BOX_RESTITUTION);
  const l = box.x - box.width / 2;
  const r = box.x + box.width / 2;
  const t = box.y - box.height / 2;
  const b = box.y + box.height / 2;
  addSegment(world, l, t, r, t, e, entity);
  addSegment(world, r, t, r, b, e, entity);
  addSegment(world, r, b, l, b, e, entity);
  addSegment(world, l, b, l, t, e, entity);
  return entity;
}

function addSpringboard(world: World, spec: SpringboardSpec): Entity {
  const entity = world.create();
  const len = Math.sqrt(spec.dirX * spec.dirX + spec.dirY * spec.dirY) || 1;
  world.add(entity, Kind, { kind: 'springboard' });
  world.add(entity, Springboard, {
    zone: rect(spec.x, spec.y, spec.width, spec.height),
    dirX: spec.dirX / len,
    dirY: spec.dirY / len,
    impulse: spec.impulse ?? RULES.springImpulse,
    inside: [],
  });
  return entity;
}

function addHazard(world: World, spec: HazardSpec): Entity {
  const entity = world.create();
  world.add(entity, Kind, { kind: spec.kind });
  world.add(entity, Hazard, { hazardKind: spec.kind, zone: spec.zone });
  return entity;
}

// Réexporté pour les règles : la santé est définie avec les composants.
import { Health } from './components';
