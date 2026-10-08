import { describe, expect, it } from 'vitest';
import { CircleBody, Transform } from '../src/core/physics';
import { Enemy, Health } from '../src/sim/components';
import { DEFAULT_MODIFIERS, type RunModifiers } from '../src/sim/modifiers';
import type { HeroCarry, RoomSpec } from '../src/sim/room';
import { RoomRun } from '../src/sim/rules/turn';
import { DEFAULT_SIM } from '../src/sim/simulation';

function room(overrides: Partial<RoomSpec> = {}): RoomSpec {
  return {
    id: 'test',
    name: 'Salle de test',
    width: 10,
    height: 10,
    seed: 7,
    wallRestitution: 0.7,
    hero: { x: 5, y: 8 },
    enemies: [],
    pushables: [],
    boxes: [],
    springboards: [],
    hazards: [],
    objective: { type: 'eliminate' },
    ...overrides,
  };
}

const FAR_GELEE = { archetype: 'gelee', x: 9, y: 1 } as const;
const CRAPAUD_MUR = { archetype: 'crapaud', x: 5, y: 1.5 } as const;
const NU: HeroCarry = { hp: 3, charge: 0, form: 'none', element: 'none' };

function withMods(spec: RoomSpec, mods: Partial<RunModifiers>, carry = NU): RoomRun {
  return RoomRun.fromSpec(spec, carry, DEFAULT_SIM, { ...DEFAULT_MODIFIERS, ...mods });
}

function play(run: RoomRun, dirX: number, dirY: number, power = 1) {
  expect(run.throwHero(dirX, dirY, power)).toBe(true);
  const events: ReturnType<RoomRun['tick']> = [];
  while (run.phase === 'moving') events.push(...run.tick());
  return events;
}

function enemyAt(run: RoomRun, index: number) {
  const entity = run.enemies()[index]!;
  const { world } = run.sim;
  return { entity, enemy: world.require(entity, Enemy), health: world.require(entity, Health), t: world.require(entity, Transform) };
}

describe('cœur de tour : une élimination fait rejouer', () => {
  it('relance sans frappe ennemie et sans changer de tour quand un ennemi meurt', () => {
    const run = RoomRun.fromSpec(room({ enemies: [CRAPAUD_MUR, FAR_GELEE] }));
    const intentBefore = enemyAt(run, 1).enemy.intent;
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'death')).toBe(true);
    expect(events.find((e) => e.type === 'replay')).toMatchObject({ type: 'replay', reason: 'kill' });
    // Le journal garde l'événement « turn » du premier tour ; aucun autre tour ne commence.
    expect(events.filter((e) => e.type === 'turn')).toHaveLength(1);
    expect(events.some((e) => e.type === 'heroHit' || e.type === 'move')).toBe(false);
    expect(run.phase).toBe('aim');
    expect(run.state.turn).toBe(1);
    // Les intentions restent figées : pas de nouveau tour.
    expect(enemyAt(run, 0).enemy.intent).toBe(intentBefore);
  });

  it('sans élimination, le tour se résout normalement', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE] }));
    const events = play(run, 1, 0, 0.3);
    expect(events.some((e) => e.type === 'replay')).toBe(false);
    expect(run.state.turn).toBe(2);
  });
});

describe('charmes : règles modifiées', () => {
  it('Corde double : deux lancers par tour, la frappe ennemie attend le second', () => {
    const run = withMods(room({ enemies: [{ archetype: 'gelee', x: 5, y: 6 }, FAR_GELEE] }), { throwsPerTurn: 2 });
    const first = play(run, 1, 0, 0.1);
    expect(first.find((e) => e.type === 'replay')).toMatchObject({ reason: 'corde' });
    expect(first.some((e) => e.type === 'heroHit')).toBe(false);
    expect(run.state.turn).toBe(1);
    const second = play(run, -1, 0, 0.1);
    expect(second.some((e) => e.type === 'replay')).toBe(false);
    expect(run.state.turn).toBe(2);
    expect(run.hero.throwsLeft).toBe(2);
  });

  it('Grelot : un demi-pas suffit à sonner', () => {
    const spec = room({ enemies: [{ archetype: 'rocailleux', x: 2, y: 2 }, FAR_GELEE] });
    for (const [stunDisplacement, expected] of [[1, false], [0.5, true]] as const) {
      const run = withMods(spec, { stunDisplacement });
      const { enemy } = enemyAt(run, 0);
      enemy.turnStartX -= 0.7;
      const events = play(run, 1, 0, 0.1);
      expect(events.some((e) => e.type === 'stun')).toBe(expected);
    }
  });

  it('Ricochet d\'or : un rebond de mur ajoute un point au prochain impact', () => {
    // Dodu part vers le mur du bas, revient et frappe la gelée à deux points de vie.
    const spec = room({ enemies: [{ archetype: 'gelee', x: 5, y: 3 }, FAR_GELEE] });
    const plain = RoomRun.fromSpec(spec);
    play(plain, 0, 1);
    expect(enemyAt(plain, 0).health.hp).toBe(1);
    const gilded = withMods(spec, { wallBounceBonus: true });
    const events = play(gilded, 0, 1);
    expect(events.some((e) => e.type === 'damage' && e.amount === 2)).toBe(true);
    expect(gilded.enemies()).toHaveLength(1);
  });

  it('Mors de fer : le premier impact du lancer frappe plus fort, pas le second', () => {
    const run = withMods(room({ enemies: [{ archetype: 'gelee', x: 5, y: 3 }, FAR_GELEE] }), { firstImpactBonus: 1 });
    const events = play(run, 0, -1);
    expect(events.find((e) => e.type === 'damage')).toMatchObject({ amount: 2 });
    expect(run.hero.firstImpactDone).toBe(true);
  });

  it('Bouclier de plumes : le premier coup reçu dans la salle est annulé, pas le deuxième', () => {
    const run = withMods(room({ enemies: [{ archetype: 'gelee', x: 5, y: 6.4 }, FAR_GELEE] }), { firstHitShield: true });
    const first = play(run, 0, -1, 0.3);
    expect(first.some((e) => e.type === 'blocked')).toBe(true);
    expect(first.some((e) => e.type === 'heroHit')).toBe(false);
    expect(run.hero.hp).toBe(3);
    const second = play(run, 0, -1, 0.05);
    expect(second.some((e) => e.type === 'heroHit')).toBe(true);
    expect(run.hero.hp).toBe(2);
  });

  it('Œuf de secours : revive relève Dodu avec un cœur et ouvre un tour neuf', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 5, y: 6.4 }, FAR_GELEE] }), { ...NU, hp: 1 });
    play(run, 0, -1, 0.3);
    expect(run.phase).toBe('lost');
    expect(run.revive()).toBe(true);
    expect(run.phase).toBe('aim');
    expect(run.hero.hp).toBe(1);
    expect(run.state.log.some((e) => e.type === 'revive')).toBe(true);
    expect(run.revive()).toBe(false);
  });

  it('Plume de plomb et Bille de verre : masse et rebond du corps au lancer ; Tambour : jauge plus courte', () => {
    const heavy = withMods(room({ enemies: [FAR_GELEE] }), { heroMassScale: 2, heroRestitution: 0.95, chargeMax: 2 });
    heavy.throwHero(0, -1, 1);
    const body = heavy.sim.world.require(heavy.heroEntity, CircleBody);
    expect(body.mass).toBe(2);
    expect(body.restitution).toBe(0.95);
    expect(heavy.hero.chargeMax).toBe(2);
  });

  it('élite : chaque ennemi a un point de vie de plus ; Veiller : cœurs maximum', () => {
    const run = withMods(room({ enemies: [{ archetype: 'crapaud', x: 5, y: 3 }] }), { enemyHpBonus: 1, maxHp: 5 }, { ...NU, hp: 5 });
    expect(enemyAt(run, 0).health).toEqual({ hp: 3, max: 3 });
    expect(run.hero.maxHp).toBe(5);
    expect(run.hero.hp).toBe(5);
  });
});

describe('déplacement des ennemis entre les tours', () => {
  it('le crapaud bondit vers Dodu à partir du deuxième tour, la gelée rampe, le rocailleux avance peu', () => {
    const run = RoomRun.fromSpec(room({ hero: { x: 5, y: 9 }, enemies: [{ archetype: 'crapaud', x: 5, y: 2 }, { archetype: 'gelee', x: 2, y: 2 }, { archetype: 'rocailleux', x: 8, y: 2 }] }));
    expect(run.state.log.some((e) => e.type === 'move')).toBe(false);
    const events = play(run, 1, 0, 0.05);
    const moves = events.filter((e) => e.type === 'move');
    expect(moves).toHaveLength(3);
    expect(enemyAt(run, 0).t.y).toBeCloseTo(3.5, 3);
    expect(Math.hypot(enemyAt(run, 1).t.x - 2, enemyAt(run, 1).t.y - 2)).toBeCloseTo(0.6, 3);
    expect(Math.hypot(enemyAt(run, 2).t.x - 8, enemyAt(run, 2).t.y - 2)).toBeCloseTo(0.3, 3);
  });

  it('un ennemi sonné ne bouge pas, et une boîte arrête le pas', () => {
    const run = RoomRun.fromSpec(room({ hero: { x: 5, y: 9 }, enemies: [{ archetype: 'crapaud', x: 5, y: 2 }, FAR_GELEE], boxes: [{ x: 5, y: 3.4, width: 1, height: 0.6 }] }));
    play(run, 1, 0, 0.05);
    const { t } = enemyAt(run, 0);
    expect(t.y).toBeGreaterThan(2);
    expect(t.y).toBeLessThan(2.7);

    const stunned = RoomRun.fromSpec(room({ hero: { x: 5, y: 9 }, enemies: [{ archetype: 'crapaud', x: 5, y: 2 }, FAR_GELEE] }));
    enemyAt(stunned, 0).enemy.stunned = true;
    stunned.state.turn = 2;
    play(stunned, 1, 0, 0.05);
    // Le sonné posé à la main est effacé au tour suivant, mais il a bloqué le pas de ce tour.
    expect(enemyAt(stunned, 0).t.y).toBe(2);
  });
});
