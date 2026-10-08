/**
 * Déplacement des ennemis entre les tours : chacun avance vers Dodu d'un pas
 * propre à son archétype et s'arrête devant un mur, une boîte, un corps ou un
 * gouffre. Déterministe, sans trigonométrie : direction normalisée, pas de 0,1.
 */
import type { Entity, World } from '../../core/ecs/world';
import { normalize } from '../../core/math/vec2';
import { BoxShape, CircleBody, Transform } from '../../core/physics';
import type { Archetype } from '../archetypes';
import { Enemy, Hazard, type RuleEvent } from '../components';
import { pointInZone } from '../zones';

/** Pas par tour, en unités. Le boss ne bouge pas. */
export const MOVE_STEP: Record<Archetype, number> = { crapaud: 1.5, gelee: 0.6, rocailleux: 0.3, boss: 0 };

const INCREMENT = 0.1;

function free(world: World, self: Entity, x: number, y: number, r: number, width: number, height: number): boolean {
  if (x - r < 0 || x + r > width || y - r < 0 || y + r > height) return false;
  for (const box of world.query(Transform, BoxShape)) {
    const t = world.require(box, Transform);
    const s = world.require(box, BoxShape);
    const qx = Math.max(t.x - s.halfWidth, Math.min(x, t.x + s.halfWidth));
    const qy = Math.max(t.y - s.halfHeight, Math.min(y, t.y + s.halfHeight));
    if ((x - qx) ** 2 + (y - qy) ** 2 < r * r) return false;
  }
  for (const body of world.query(Transform, CircleBody)) {
    if (body === self) continue;
    const t = world.require(body, Transform);
    const o = world.require(body, CircleBody).radius;
    if ((t.x - x) ** 2 + (t.y - y) ** 2 < (r + o) ** 2) return false;
  }
  for (const hazard of world.query(Hazard)) {
    if (pointInZone(x, y, world.require(hazard, Hazard).zone)) return false;
  }
  return true;
}

/** Fait avancer les ennemis non sonnés vers le héros ; journalise chaque déplacement. */
export function moveEnemies(world: World, hero: Entity, width: number, height: number, log: RuleEvent[]): void {
  const h = world.require(hero, Transform);
  for (const entity of world.query(Enemy, Transform, CircleBody)) {
    const enemy = world.require(entity, Enemy);
    if (enemy.stunned) continue;
    const step = MOVE_STEP[enemy.archetype];
    if (step <= 0) continue;
    const t = world.require(entity, Transform);
    const r = world.require(entity, CircleBody).radius;
    const d = normalize({ x: h.x - t.x, y: h.y - t.y });
    if (d.x === 0 && d.y === 0) continue;
    const fromX = t.x;
    const fromY = t.y;
    let moved = 0;
    while (moved + INCREMENT <= step + 1e-9) {
      const nx = fromX + d.x * (moved + INCREMENT);
      const ny = fromY + d.y * (moved + INCREMENT);
      if (!free(world, entity, nx, ny, r, width, height)) break;
      moved += INCREMENT;
    }
    if (moved <= 0) continue;
    t.x = fromX + d.x * moved;
    t.y = fromY + d.y * moved;
    log.push({ type: 'move', entity, fromX, fromY, toX: t.x, toY: t.y });
  }
}
