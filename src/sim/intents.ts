/**
 * Motifs d'attaque par archétype. Les zones sont calculées depuis la position
 * de l'ennemi et celle du héros au moment de l'intention, puis figées au sol.
 * Aucune trigonométrie : les rotations de 60 degrés utilisent des constantes.
 */
import { normalize, perpendicular, type Vec2 } from '../core/math/vec2';
import { ENEMIES, RULES, type Archetype, type EnemyRole } from './archetypes';
import type { Intent } from './components';
import { disc, poly, type Zone } from './zones';

const COS60 = 0.5;
const SIN60 = 0.8660254037844386;

export const BOSS_CYCLE = ['balayage', 'pilonnage', 'souffle', 'essouffle'] as const;

/** Direction unitaire de l'ennemi vers le héros, vers le bas de l'arène par défaut. */
export function facing(from: Vec2, to: Vec2): Vec2 {
  const d = normalize({ x: to.x - from.x, y: to.y - from.y });
  return d.x === 0 && d.y === 0 ? { x: 0, y: 1 } : d;
}

export function chooseIntent(archetype: Archetype, enemy: Vec2, hero: Vec2, cycleIndex: number, role: EnemyRole = 'none'): Intent {
  const profile = ENEMIES[archetype];
  if (role !== 'none') return roleIntent(role, profile.radius, enemy, hero);
  switch (archetype) {
    case 'crapaud':
      return { pattern: 'bond', zones: [disc(enemy.x, enemy.y, profile.zoneRadius)], harmless: false };
    case 'gelee':
      return { pattern: 'etreinte', zones: [disc(enemy.x, enemy.y, profile.zoneRadius)], harmless: false };
    case 'rocailleux': {
      const d = facing(enemy, hero);
      const reach = profile.radius + 1;
      return { pattern: 'coup', zones: [disc(enemy.x + d.x * reach, enemy.y + d.y * reach, profile.zoneRadius)], harmless: false };
    }
    case 'boss':
      return bossIntent(enemy, hero, cycleIndex, profile.zoneRadius);
  }
}

/**
 * Un rôle remplace la frappe : le guérisseur soigne depuis un petit disque,
 * l'artificier et le bâtisseur posent devant eux, vers le héros. Aucune de
 * ces zones ne blesse.
 */
function roleIntent(role: Exclude<EnemyRole, 'none'>, radius: number, enemy: Vec2, hero: Vec2): Intent {
  if (role === 'guerisseur') return { pattern: 'soin', zones: [disc(enemy.x, enemy.y, RULES.healerZoneRadius)], harmless: true };
  const d = facing(enemy, hero);
  const reach = radius + 1;
  const zone = disc(enemy.x + d.x * reach, enemy.y + d.y * reach, RULES.placeZoneRadius);
  return { pattern: role === 'artificier' ? 'pose' : 'chantier', zones: [zone], harmless: true };
}

function bossIntent(boss: Vec2, hero: Vec2, cycleIndex: number, discRadius: number): Intent {
  const pattern = BOSS_CYCLE[cycleIndex % BOSS_CYCLE.length]!;
  const d = facing(boss, hero);
  switch (pattern) {
    case 'balayage': {
      const length = 8;
      const left = { x: d.x * COS60 - d.y * SIN60, y: d.y * COS60 + d.x * SIN60 };
      const right = { x: d.x * COS60 + d.y * SIN60, y: d.y * COS60 - d.x * SIN60 };
      const zone: Zone = poly([
        { x: boss.x, y: boss.y },
        { x: boss.x + left.x * length, y: boss.y + left.y * length },
        { x: boss.x + d.x * length * 1.15, y: boss.y + d.y * length * 1.15 },
        { x: boss.x + right.x * length, y: boss.y + right.y * length },
      ]);
      return { pattern, zones: [zone], harmless: false };
    }
    case 'pilonnage':
      return {
        pattern,
        zones: [2.5, 4, 5.5].map((dist) => disc(boss.x + d.x * dist, boss.y + d.y * dist, discRadius)),
        harmless: false,
      };
    case 'souffle': {
      const n = perpendicular(d);
      const half = 0.8;
      const length = 9;
      const zone: Zone = poly([
        { x: boss.x + n.x * half, y: boss.y + n.y * half },
        { x: boss.x + d.x * length + n.x * half, y: boss.y + d.y * length + n.y * half },
        { x: boss.x + d.x * length - n.x * half, y: boss.y + d.y * length - n.y * half },
        { x: boss.x - n.x * half, y: boss.y - n.y * half },
      ]);
      return { pattern, zones: [zone], harmless: false };
    }
    case 'essouffle':
      return { pattern, zones: [], harmless: false };
  }
}
