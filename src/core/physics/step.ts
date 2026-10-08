/**
 * Pas de physique déterministe.
 *
 * Chaque pas dure exactement `dt`. À l'intérieur, les contacts sont traités
 * dans l'ordre de leur temps d'impact : on avance tous les corps jusqu'au
 * premier contact, on le résout par impulsion, puis on recommence avec le temps
 * restant. Une passe finale écarte les pénétrations résiduelles.
 *
 * Aucune horloge, aucun aléatoire, aucune trigonométrie : seulement des
 * additions, des multiplications et des racines carrées.
 */
import type { Entity, World } from '../ecs/world';
import { circleCircleToi, circleSegmentToi, closestPointOnSegment } from './collision';
import { CircleBody, SegmentBody, Transform, Velocity } from './components';

export interface PhysicsConfig {
  /** Durée d'un pas, en secondes. */
  dt: number;
  /** Plafond de vitesse : garantit qu'un corps ne franchit jamais un mur en un pas. */
  maxSpeed: number;
  /** En dessous de cette vitesse, un corps s'arrête net. */
  sleepSpeed: number;
  /** Nombre maximal de contacts résolus par pas, protection contre les boucles. */
  maxContactsPerStep: number;
  /**
   * Filtre optionnel : faux pour ignorer un couple corps mobile / segment,
   * par exemple un héros rebondissant qui saute par-dessus une caisse. Doit
   * être une fonction pure du monde pour rester déterministe.
   */
  canCollide?: (world: World, dynamic: Entity, segment: Entity) => boolean;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  dt: 1 / 120,
  maxSpeed: 30,
  sleepSpeed: 0.05,
  maxContactsPerStep: 16,
};

/** Événement de contact émis pendant un pas. `b` vaut `null` contre un segment. */
export interface ContactEvent {
  step: number;
  a: Entity;
  b: Entity | null;
  /** Segment touché quand `b` est `null`. */
  segment: Entity | null;
  /** Normale pointant vers `a`, ou de `a` vers `b` pour deux cercles. */
  nx: number;
  ny: number;
  /** Vitesse d'approche le long de la normale au moment du choc. */
  impactSpeed: number;
  /** Position de `a` au moment du choc. */
  x: number;
  y: number;
  /** Vitesses avant résolution, pour les règles qui veulent les rejouer ou les refléter. */
  aVelBefore: { x: number; y: number };
  bVelBefore: { x: number; y: number } | null;
  /** Vitesse scalaire de `a` avant le choc. */
  aSpeedBefore: number;
  bSpeedBefore: number;
}

/**
 * Crochet appelé après la résolution standard de chaque contact. Les règles de
 * jeu (collant, bumper, dégâts, casse) s'y branchent en modifiant le monde.
 * Renvoyer `true` signale qu'une entité a été créée ou détruite : le pas
 * recharge alors ses listes de corps avant de continuer.
 */
export type ContactHook = (event: ContactEvent, world: World) => boolean | void;

interface DynamicRef {
  entity: Entity;
  transform: Transform;
  velocity: Velocity;
  body: CircleBody;
}

interface StaticRef {
  entity: Entity;
  segment: SegmentBody;
}

interface Candidate {
  t: number;
  nx: number;
  ny: number;
  a: DynamicRef;
  b: DynamicRef | null;
  segment: StaticRef | null;
}

/** Fait avancer le monde d'un pas. Retourne les contacts survenus. */
export function physicsStep(
  world: World,
  config: PhysicsConfig,
  step: number,
  hook?: ContactHook,
): ContactEvent[] {
  let dynamics = collectDynamics(world);
  let statics = collectStatics(world);
  const events: ContactEvent[] = [];
  const filter = config.canCollide;

  applyRollingDeceleration(dynamics, config);

  let remaining = config.dt;
  for (let iteration = 0; iteration < config.maxContactsPerStep && remaining > 0; iteration++) {
    const candidate = earliestContact(dynamics, statics, remaining, filter ? (d, s) => filter(world, d, s) : null);
    if (!candidate) break;
    advance(dynamics, candidate.t);
    remaining -= candidate.t;
    const event = resolve(candidate, step);
    events.push(event);
    if (hook?.(event, world) === true) {
      dynamics = collectDynamics(world);
      statics = collectStatics(world);
    }
  }
  if (remaining > 0) advance(dynamics, remaining);

  separatePenetrations(dynamics, statics, filter ? (d, s) => filter(world, d, s) : null);
  applySleep(dynamics, config);
  return events;
}

/** Vrai si plus aucun corps mobile ne bouge. */
export function isAtRest(world: World): boolean {
  for (const entity of world.query(Velocity, CircleBody)) {
    const v = world.require(entity, Velocity);
    if (v.x !== 0 || v.y !== 0) return false;
  }
  return true;
}

function collectDynamics(world: World): DynamicRef[] {
  return world.query(Transform, Velocity, CircleBody).map((entity) => ({
    entity,
    transform: world.require(entity, Transform),
    velocity: world.require(entity, Velocity),
    body: world.require(entity, CircleBody),
  }));
}

function collectStatics(world: World): StaticRef[] {
  return world.query(SegmentBody).map((entity) => ({ entity, segment: world.require(entity, SegmentBody) }));
}

function applyRollingDeceleration(dynamics: DynamicRef[], config: PhysicsConfig): void {
  for (const d of dynamics) {
    const v = d.velocity;
    const speed = Math.sqrt(v.x * v.x + v.y * v.y);
    if (speed === 0) continue;
    let next = speed - d.body.rollingDecel * config.dt;
    if (next < config.sleepSpeed) next = 0;
    if (next > config.maxSpeed) next = config.maxSpeed;
    const k = next / speed;
    v.x *= k;
    v.y *= k;
  }
}

type PairFilter = ((dynamic: Entity, segment: Entity) => boolean) | null;

function earliestContact(dynamics: DynamicRef[], statics: StaticRef[], horizon: number, filter: PairFilter): Candidate | null {
  let best: Candidate | null = null;
  for (const d of dynamics) {
    if (d.velocity.x === 0 && d.velocity.y === 0) continue;
    for (const s of statics) {
      if (filter && !filter(d.entity, s.entity)) continue;
      const seg = s.segment;
      const toi = circleSegmentToi(
        d.transform,
        d.velocity,
        d.body.radius,
        { x: seg.ax, y: seg.ay },
        { x: seg.bx, y: seg.by },
        horizon,
      );
      if (toi && (!best || toi.t < best.t)) best = { ...toi, a: d, b: null, segment: s };
    }
  }
  for (let i = 0; i < dynamics.length; i++) {
    const a = dynamics[i]!;
    for (let j = i + 1; j < dynamics.length; j++) {
      const b = dynamics[j]!;
      if (a.velocity.x === 0 && a.velocity.y === 0 && b.velocity.x === 0 && b.velocity.y === 0) continue;
      const toi = circleCircleToi(
        a.transform,
        a.velocity,
        a.body.radius,
        b.transform,
        b.velocity,
        b.body.radius,
        horizon,
      );
      if (toi && (!best || toi.t < best.t)) best = { ...toi, a, b, segment: null };
    }
  }
  return best;
}

function advance(dynamics: DynamicRef[], t: number): void {
  if (t === 0) return;
  for (const d of dynamics) {
    d.transform.x += d.velocity.x * t;
    d.transform.y += d.velocity.y * t;
  }
}

function resolve(c: Candidate, step: number): ContactEvent {
  const { a, b, nx, ny } = c;
  const aVelBefore = { x: a.velocity.x, y: a.velocity.y };
  const bVelBefore = b ? { x: b.velocity.x, y: b.velocity.y } : null;
  let impactSpeed: number;
  if (b === null) {
    const restitution = Math.max(a.body.restitution, c.segment!.segment.restitution);
    const vn = a.velocity.x * nx + a.velocity.y * ny;
    impactSpeed = -vn;
    if (vn < 0) {
      a.velocity.x -= (1 + restitution) * vn * nx;
      a.velocity.y -= (1 + restitution) * vn * ny;
    }
  } else {
    const restitution = Math.max(a.body.restitution, b.body.restitution);
    const rvx = b.velocity.x - a.velocity.x;
    const rvy = b.velocity.y - a.velocity.y;
    const vn = rvx * nx + rvy * ny;
    impactSpeed = -vn;
    if (vn < 0) {
      const invA = 1 / a.body.mass;
      const invB = 1 / b.body.mass;
      const j = (-(1 + restitution) * vn) / (invA + invB);
      a.velocity.x -= j * invA * nx;
      a.velocity.y -= j * invA * ny;
      b.velocity.x += j * invB * nx;
      b.velocity.y += j * invB * ny;
    }
  }
  return {
    step,
    a: a.entity,
    b: b ? b.entity : null,
    segment: c.segment ? c.segment.entity : null,
    nx,
    ny,
    impactSpeed,
    x: a.transform.x,
    y: a.transform.y,
    aVelBefore,
    bVelBefore,
    aSpeedBefore: Math.sqrt(aVelBefore.x * aVelBefore.x + aVelBefore.y * aVelBefore.y),
    bSpeedBefore: bVelBefore ? Math.sqrt(bVelBefore.x * bVelBefore.x + bVelBefore.y * bVelBefore.y) : 0,
  };
}

/** Passe de sécurité : écarte les corps qui se chevauchent encore, sans changer les vitesses. */
function separatePenetrations(dynamics: DynamicRef[], statics: StaticRef[], filter: PairFilter): void {
  for (const d of dynamics) {
    for (const s of statics) {
      if (filter && !filter(d.entity, s.entity)) continue;
      const seg = s.segment;
      const q = closestPointOnSegment(d.transform, { x: seg.ax, y: seg.ay }, { x: seg.bx, y: seg.by });
      const dx = d.transform.x - q.x;
      const dy = d.transform.y - q.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const depth = d.body.radius - dist;
      if (depth > 1e-7 && dist > 0) {
        d.transform.x += (dx / dist) * depth;
        d.transform.y += (dy / dist) * depth;
      }
    }
  }
  for (let i = 0; i < dynamics.length; i++) {
    const a = dynamics[i]!;
    for (let j = i + 1; j < dynamics.length; j++) {
      const b = dynamics[j]!;
      const dx = b.transform.x - a.transform.x;
      const dy = b.transform.y - a.transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const depth = a.body.radius + b.body.radius - dist;
      if (depth > 1e-7 && dist > 0) {
        const invA = 1 / a.body.mass;
        const invB = 1 / b.body.mass;
        const share = depth / (invA + invB);
        a.transform.x -= (dx / dist) * share * invA;
        a.transform.y -= (dy / dist) * share * invA;
        b.transform.x += (dx / dist) * share * invB;
        b.transform.y += (dy / dist) * share * invB;
      }
    }
  }
}

function applySleep(dynamics: DynamicRef[], config: PhysicsConfig): void {
  for (const d of dynamics) {
    const v = d.velocity;
    if (v.x * v.x + v.y * v.y < config.sleepSpeed * config.sleepSpeed) {
      v.x = 0;
      v.y = 0;
    }
  }
}
