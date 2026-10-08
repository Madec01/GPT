/**
 * Règles de contact, branchées sur le crochet de la physique. Elles lisent
 * l'événement de contact et modifient le monde : dégâts, écrasement,
 * éclatement du crapaud, boulet, bumper, collant, casse, boss. Elles
 * renvoient `true` quand une entité a été détruite ou créée.
 */
import type { Entity, World } from '../../core/ecs/world';
import { createRng } from '../../core/math/rng';
import { BoxShape, SegmentOwner, Transform, Velocity, type ContactEvent } from '../../core/physics';
import { RULES } from '../archetypes';
import { Breakable, Enemy, Health, Hero, Kind, Pickup, Pushable, RoomState, type RuleEvent } from '../components';
import { circleIntersectsZone } from '../zones';
import { CircleBody } from '../../core/physics';
import { arcDamage, arcTargets, hasAnyPower } from './powers';

interface Ctx {
  world: World;
  state: RoomState;
  changed: boolean;
}

export function roomEntity(world: World): Entity {
  const room = world.query(RoomState)[0];
  if (room === undefined) throw new Error('Aucune entité RoomState dans le monde');
  return room;
}

export function contactRules(event: ContactEvent, world: World): boolean {
  const state = world.require(roomEntity(world), RoomState);
  const ctx: Ctx = { world, state, changed: false };
  if (event.b === null) staticContact(ctx, event);
  else dynamicContact(ctx, event, event.b);
  return ctx.changed;
}

function log(ctx: Ctx, e: RuleEvent): void {
  ctx.state.log.push(e);
}

function kindOf(world: World, entity: Entity): string {
  return world.get(entity, Kind)?.kind ?? 'inconnu';
}

function position(world: World, entity: Entity): { x: number; y: number } {
  const t = world.get(entity, Transform);
  return t ? { x: t.x, y: t.y } : { x: 0, y: 0 };
}

/** Inflige des dégâts ; détruit l'entité si sa santé tombe à zéro. */
function damage(ctx: Ctx, entity: Entity, amount: number): void {
  const health = ctx.world.get(entity, Health);
  if (!health || amount <= 0) return;
  const p = position(ctx.world, entity);
  health.hp -= amount;
  log(ctx, { type: 'damage', entity, amount, x: p.x, y: p.y });
  if (health.hp <= 0) kill(ctx, entity);
}

function kill(ctx: Ctx, entity: Entity): void {
  if (!ctx.world.exists(entity)) return;
  const p = position(ctx.world, entity);
  log(ctx, { type: 'death', entity, kind: kindOf(ctx.world, entity), x: p.x, y: p.y });
  ctx.world.destroy(entity);
  ctx.changed = true;
}

/** Brise une boîte cassable : retire ses segments, applique l'éboulement, tire le butin. */
function breakBox(ctx: Ctx, box: Entity): void {
  const { world } = ctx;
  const breakable = world.get(box, Breakable);
  if (!breakable) return;
  const p = position(world, box);
  log(ctx, { type: 'break', entity: box, breakableKind: breakable.breakableKind, x: p.x, y: p.y });
  for (const segment of world.query(SegmentOwner)) {
    if (world.require(segment, SegmentOwner).owner === box) world.destroy(segment);
  }
  if (breakable.collapse) collapseOnto(ctx, breakable.collapse);
  if (breakable.breakableKind === 'crate') rollLoot(ctx, p.x, p.y);
  world.destroy(box);
  ctx.changed = true;
}

function collapseOnto(ctx: Ctx, zone: Breakable['collapse'] & object): void {
  for (const entity of ctx.world.query(Enemy, Transform, CircleBody)) {
    const t = ctx.world.require(entity, Transform);
    const r = ctx.world.require(entity, CircleBody).radius;
    if (circleIntersectsZone(t.x, t.y, r, zone)) damage(ctx, entity, RULES.columnDamageToBoss);
  }
}

function rollLoot(ctx: Ctx, x: number, y: number): void {
  const rng = createRng(ctx.state.rngState);
  const roll = rng.next();
  ctx.state.rngState = rng.getState();
  if (roll >= RULES.heartChance) return;
  const pickup = ctx.world.create();
  ctx.world.add(pickup, Kind, { kind: 'heart' });
  ctx.world.add(pickup, Pickup, { pickupKind: 'heart', x, y, r: 0.35 });
  log(ctx, { type: 'loot', x, y });
  ctx.changed = true;
}

function breakableOf(world: World, segment: Entity | null): { box: Entity; breakable: Breakable } | null {
  if (segment === null) return null;
  const owner = world.get(segment, SegmentOwner)?.owner;
  if (owner === undefined) return null;
  const breakable = world.get(owner, Breakable);
  return breakable ? { box: owner, breakable } : null;
}

function isProjectile(world: World, entity: Entity, speedBefore: number): boolean {
  if (speedBefore < RULES.projectileSpeed) return false;
  const enemy = world.get(entity, Enemy);
  if (enemy) return enemy.archetype === 'rocailleux';
  const pushable = world.get(entity, Pushable);
  return pushable?.pushableKind === 'boulder';
}

function staticContact(ctx: Ctx, event: ContactEvent): void {
  const { world } = ctx;
  const a = event.a;
  const hero = world.get(a, Hero);
  const target = breakableOf(world, event.segment);

  if (hero) {
    hero.lastContactStep = event.step;
    if (hasAnyPower(hero) && event.impactSpeed >= RULES.chargeMinSpeed && hero.charge < hero.chargeMax) {
      hero.charge++;
      log(ctx, { type: 'charge', value: hero.charge, max: hero.chargeMax });
    }
    if (hero.form === 'glu' && !hero.anchored) {
      anchorHero(ctx, a, hero, false);
      return;
    }
    if (!target) return;
    // Boulet de siège : propre à la forme Pierre.
    const strongPass = hero.strongThrow && hero.form === 'pierre' && !hero.strongPassUsed;
    if (strongPass) {
      // Boulet de siège : le premier obstacle cède sans ralentir Dodu.
      hero.strongPassUsed = true;
      const v = world.require(a, Velocity);
      v.x = event.aVelBefore.x;
      v.y = event.aVelBefore.y;
      breakBox(ctx, target.box);
    } else if (target.breakable.breakableKind === 'crate' && event.impactSpeed >= RULES.crateBreakSpeed) {
      breakBox(ctx, target.box);
    }
    return;
  }

  const enemy = world.get(a, Enemy);
  if (enemy) {
    if (enemy.archetype === 'crapaud' && event.impactSpeed >= RULES.crapaudBurstSpeed) {
      kill(ctx, a);
    } else if (event.impactSpeed >= RULES.damageMinSpeed && enemy.archetype !== 'boss') {
      damage(ctx, a, 1);
    }
  }

  if (!target) return;
  const projectile = isProjectile(world, a, event.aSpeedBefore);
  if (projectile) breakBox(ctx, target.box);
  else if (target.breakable.breakableKind === 'crate' && event.impactSpeed >= RULES.crateBreakSpeed) breakBox(ctx, target.box);
}

function dynamicContact(ctx: Ctx, event: ContactEvent, b: Entity): void {
  const { world } = ctx;
  const a = event.a;
  const heroA = world.get(a, Hero);
  const heroB = world.get(b, Hero);
  if (heroA || heroB) {
    const hero = heroA ? a : b;
    const other = heroA ? b : a;
    heroContact(ctx, event, hero, other, heroA !== undefined);
    return;
  }
  const enemyA = world.get(a, Enemy);
  const enemyB = world.get(b, Enemy);
  if (enemyA && enemyB) {
    enemyEnemy(ctx, event, a, b);
    return;
  }
  if (enemyA || enemyB) {
    const enemy = enemyA ? a : b;
    const other = enemyA ? b : a;
    const otherSpeed = enemyA ? event.bSpeedBefore : event.aSpeedBefore;
    enemyPushable(ctx, event, enemy, other, otherSpeed);
  }
}

/** Ancre Dodu sur place, forme gluante. */
function anchorHero(ctx: Ctx, hero: Entity, h: Hero, onEnemy: boolean): void {
  const v = ctx.world.require(hero, Velocity);
  v.x = 0;
  v.y = 0;
  h.anchored = true;
  h.anchoredOnEnemy = onEnemy;
  const p = position(ctx.world, hero);
  log(ctx, { type: 'anchor', x: p.x, y: p.y });
}

/** Dégâts de Dodu sur un ennemi, puis arcs électriques vers les voisins. */
function heroDamages(ctx: Ctx, h: Hero, target: Entity, amount: number): void {
  const impact = position(ctx.world, target);
  damage(ctx, target, amount);
  if (h.element !== 'electricite') return;
  const dmg = arcDamage(h);
  for (const arc of arcTargets(ctx.world, h, target, impact.x, impact.y)) {
    const to = position(ctx.world, arc.to);
    log(ctx, { type: 'arc', fromX: arc.from.x, fromY: arc.from.y, toX: to.x, toY: to.y, entity: arc.to });
    const enemy = ctx.world.get(arc.to, Enemy);
    if (enemy?.archetype === 'boss') continue;
    damage(ctx, arc.to, dmg);
  }
}

function heroContact(ctx: Ctx, event: ContactEvent, hero: Entity, other: Entity, heroIsA: boolean): void {
  const { world } = ctx;
  const h = world.require(hero, Hero);
  h.lastContactStep = event.step;
  const enemy = world.get(other, Enemy);
  if (!enemy) return;
  const heroVelBefore = heroIsA ? event.aVelBefore : event.bVelBefore!;
  // Normale orientée de l'ennemi vers le héros.
  const nx = heroIsA ? -event.nx : event.nx;
  const ny = heroIsA ? -event.ny : event.ny;
  const p = position(world, hero);

  switch (enemy.archetype) {
    case 'crapaud': {
      const v = world.require(hero, Velocity);
      const vn = heroVelBefore.x * nx + heroVelBefore.y * ny;
      v.x = (heroVelBefore.x - 2 * vn * nx) * RULES.bumperReturn;
      v.y = (heroVelBefore.y - 2 * vn * ny) * RULES.bumperReturn;
      log(ctx, { type: 'bumper', x: p.x, y: p.y });
      if (event.impactSpeed >= RULES.damageMinSpeed) heroDamages(ctx, h, other, RULES.heroDamage);
      break;
    }
    case 'gelee': {
      const v = world.require(hero, Velocity);
      v.x = 0;
      v.y = 0;
      log(ctx, { type: 'stick', x: p.x, y: p.y });
      if (event.impactSpeed >= RULES.damageMinSpeed) heroDamages(ctx, h, other, RULES.heroDamage);
      break;
    }
    case 'rocailleux': {
      if (h.strongThrow && h.form === 'pierre') {
        const v = world.require(other, Velocity);
        v.x = heroVelBefore.x;
        v.y = heroVelBefore.y;
      }
      if (event.impactSpeed >= RULES.damageMinSpeed) heroDamages(ctx, h, other, RULES.heroDamage);
      break;
    }
    case 'boss': {
      if (h.strongThrow && h.form === 'pierre') heroDamages(ctx, h, other, RULES.strongDirectDamageToBoss);
      break;
    }
  }
  // Glu en version forte : Dodu s'accroche au premier ennemi frappé, s'il est encore là.
  if (h.form === 'glu' && h.strongThrow && !h.anchored && world.exists(other)) anchorHero(ctx, hero, h, true);
}

function enemyEnemy(ctx: Ctx, event: ContactEvent, a: Entity, b: Entity): void {
  const { world } = ctx;
  if (event.impactSpeed < RULES.damageMinSpeed) return;
  const archA = world.require(a, Enemy).archetype;
  const archB = world.require(b, Enemy).archetype;
  const projectileA = isProjectile(world, a, event.aSpeedBefore);
  const projectileB = isProjectile(world, b, event.bSpeedBefore);
  const burst = event.impactSpeed >= RULES.crapaudBurstSpeed;

  const hit = (target: Entity, arch: string, amount: number): void => {
    if (arch === 'crapaud' && burst) kill(ctx, target);
    else if (arch === 'boss' && amount < RULES.projectileDamage) return;
    else damage(ctx, target, amount);
  };

  if (projectileA && !projectileB) hit(b, archB, RULES.projectileDamage);
  else if (projectileB && !projectileA) hit(a, archA, RULES.projectileDamage);
  else {
    hit(a, archA, 1);
    hit(b, archB, 1);
  }
}

function enemyPushable(ctx: Ctx, event: ContactEvent, enemy: Entity, other: Entity, otherSpeedBefore: number): void {
  const pushable = ctx.world.get(other, Pushable);
  if (!pushable || pushable.pushableKind !== 'boulder') return;
  if (otherSpeedBefore < RULES.damageMinSpeed || event.impactSpeed < RULES.damageMinSpeed) return;
  damage(ctx, enemy, RULES.boulderDamageToBoss);
}

/** Boîte dont l'entité donnée est une face, utile au rendu des cassables. */
export function boxOf(world: World, entity: Entity): BoxShape | undefined {
  return world.get(entity, BoxShape);
}
