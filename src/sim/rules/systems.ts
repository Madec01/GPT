/**
 * Systèmes exécutés après la physique à chaque pas : tremplins, gouffres et
 * cœurs de soin. Ils ne dépendent que du monde.
 */
import type { World } from '../../core/ecs/world';
import { CircleBody, Transform, Velocity } from '../../core/physics';
import { Enemy, Hazard, Hero, Kind, Pickup, Pushable, RoomState, Springboard, type RuleEvent } from '../components';
import { pointInZone } from '../zones';
import { roomEntity } from './contacts';

function log(world: World, event: RuleEvent): void {
  world.require(roomEntity(world), RoomState).log.push(event);
}

export function springboardSystem(world: World): void {
  const bodies = world.query(Transform, Velocity, CircleBody);
  for (const spring of world.query(Springboard)) {
    const s = world.require(spring, Springboard);
    for (const body of bodies) {
      const t = world.require(body, Transform);
      const inside = pointInZone(t.x, t.y, s.zone);
      const index = s.inside.indexOf(body);
      if (inside && index === -1) {
        const v = world.require(body, Velocity);
        v.x += s.dirX * s.impulse;
        v.y += s.dirY * s.impulse;
        s.inside.push(body);
        log(world, { type: 'spring', entity: body, x: t.x, y: t.y });
      } else if (!inside && index !== -1) {
        s.inside.splice(index, 1);
      }
    }
  }
}

export function pitSystem(world: World): void {
  for (const pit of world.query(Hazard)) {
    const zone = world.require(pit, Hazard).zone;
    for (const body of world.query(Transform, Velocity, CircleBody)) {
      const t = world.require(body, Transform);
      if (!pointInZone(t.x, t.y, zone)) continue;
      const kind = world.get(body, Kind)?.kind ?? 'inconnu';
      log(world, { type: 'fall', entity: body, kind, x: t.x, y: t.y });
      const v = world.require(body, Velocity);
      v.x = 0;
      v.y = 0;
      const hero = world.get(body, Hero);
      if (hero) {
        const state = world.require(roomEntity(world), RoomState);
        if (!state.invincible) hero.hp -= 1;
        state.heroHits++;
        t.x = hero.throwOriginX;
        t.y = hero.throwOriginY;
        continue;
      }
      const pushable = world.get(body, Pushable);
      if (pushable) {
        t.x = pushable.startX;
        t.y = pushable.startY;
        continue;
      }
      if (world.has(body, Enemy)) world.destroy(body);
    }
  }
}

export function pickupSystem(world: World): void {
  const [hero] = world.query(Hero, Transform, CircleBody);
  if (hero === undefined) return;
  const h = world.require(hero, Hero);
  const t = world.require(hero, Transform);
  const r = world.require(hero, CircleBody).radius;
  for (const pickup of world.query(Pickup)) {
    const p = world.require(pickup, Pickup);
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const reach = r + p.r;
    if (dx * dx + dy * dy > reach * reach) continue;
    if (h.hp < h.maxHp) {
      h.hp++;
      log(world, { type: 'heal', amount: 1 });
    }
    world.destroy(pickup);
  }
}

export const TICK_SYSTEMS = [springboardSystem, pitSystem, pickupSystem] as const;
