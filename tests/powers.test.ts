import { describe, expect, it } from 'vitest';
import { Transform } from '../src/core/physics';
import { Breakable, Health } from '../src/sim/components';
import type { HeroCarry, RoomSpec } from '../src/sim/room';
import { arcTargets, FORM_CARDS, passOverFilter, synergyLine } from '../src/sim/rules/powers';
import { predictRoomThrow, RoomRun } from '../src/sim/rules/turn';
import { solveRoom } from '../src/sim/solver';
import { roomById } from '../src/data/rooms';

function room(overrides: Partial<RoomSpec> = {}): RoomSpec {
  return {
    id: 'test',
    name: 'Salle de test',
    width: 10,
    height: 10,
    seed: 7,
    wallRestitution: 0.7,
    hero: { x: 5, y: 8 },
    enemies: [{ archetype: 'gelee', x: 9, y: 1 }],
    pushables: [],
    boxes: [],
    springboards: [],
    hazards: [],
    objective: { type: 'eliminate' },
    ...overrides,
  };
}

const carry = (form: HeroCarry['form'], element: HeroCarry['element'] = 'none', charge = 0): HeroCarry => ({ hp: 3, charge, form, element });

function play(run: RoomRun, dirX: number, dirY: number, power = 1) {
  expect(run.throwHero(dirX, dirY, power)).toBe(true);
  const events: ReturnType<RoomRun['tick']> = [];
  let minY = run.heroPosition().y;
  while (run.phase === 'moving') {
    events.push(...run.tick());
    minY = Math.min(minY, run.heroPosition().y);
  }
  return { events, minY };
}

describe('forme Rebond', () => {
  const spec = room({ boxes: [{ x: 5, y: 5, width: 1, height: 1, breakable: 'crate' }, { x: 5, y: 2.5, width: 3, height: 0.5, breakable: 'barricade' }] });

  it('saute par-dessus la caisse lancé assez vite, mais pas la barricade', () => {
    const run = RoomRun.fromSpec(spec, carry('rebond'));
    const { events, minY } = play(run, 0, -1, 1);
    expect(events.some((e) => e.type === 'break')).toBe(false);
    expect(run.sim.world.query(Breakable)).toHaveLength(2);
    expect(minY).toBeLessThan(4.5);
    expect(minY).toBeGreaterThan(2.75);
  });

  it('percute la caisse lancé lentement', () => {
    const run = RoomRun.fromSpec(spec, carry('rebond'));
    const { minY } = play(run, 0, -1, 0.35);
    expect(minY).toBeGreaterThanOrEqual(5.99);
  });

  it('franchit la barricade en version forte', () => {
    const run = RoomRun.fromSpec(spec, carry('rebond', 'none', 3));
    const { minY } = play(run, 0, -1, 1);
    expect(minY).toBeLessThan(2.25);
  });

  it('le filtre est une fonction pure du monde', () => {
    const run = RoomRun.fromSpec(spec, carry('rebond'));
    const [crateSeg] = run.sim.world.query();
    expect(typeof passOverFilter(run.sim.world, run.heroEntity, crateSeg!)).toBe('boolean');
  });
});

describe('forme Glu', () => {
  it('s\'ancre au premier mur touché, une fois par lancer', () => {
    const run = RoomRun.fromSpec(room(), carry('glu'));
    const { events } = play(run, 0, -1, 1);
    expect(events.filter((e) => e.type === 'anchor')).toHaveLength(1);
    expect(run.heroPosition().y).toBeCloseTo(0.5, 6);
  });

  it('en version forte, s\'accroche au premier ennemi frappé après l\'avoir blessé', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 4 }] }), carry('glu', 'none', 3));
    const { events } = play(run, 0, -1, 1);
    expect(events.some((e) => e.type === 'damage')).toBe(true);
    expect(events.some((e) => e.type === 'anchor')).toBe(true);
    // Dodu s'est arrêté net au contact ; le rocailleux, lui, a été projeté plus loin.
    expect(run.hero.anchoredOnEnemy).toBe(true);
    expect(run.heroPosition().y).toBeGreaterThan(4.5);
    const [enemy] = run.enemies();
    expect(run.sim.world.require(enemy!, Transform).y).toBeLessThan(4);
  });
});

describe('élément Électricité', () => {
  const trio = room({
    enemies: [
      { archetype: 'rocailleux', x: 5, y: 4 },
      { archetype: 'crapaud', x: 6.5, y: 4.2 },
      { archetype: 'gelee', x: 8.2, y: 4.4 },
    ],
  });

  it('foudroie le voisin de l\'ennemi frappé, pas le voisin du voisin', () => {
    const run = RoomRun.fromSpec(trio, carry('none', 'electricite'));
    const { events } = play(run, 0, -1, 1);
    const arcs = events.filter((e) => e.type === 'arc');
    expect(arcs.length).toBeGreaterThanOrEqual(1);
    const hp = run.enemies().map((e) => run.sim.world.require(e, Health).hp);
    // Rocailleux frappé 3 -> 2, crapaud foudroyé 2 -> 1, gelée hors de portée 2.
    expect(hp).toEqual([2, 1, 2]);
  });

  it('en version forte, la chaîne saute d\'ennemi en ennemi', () => {
    const run = RoomRun.fromSpec(trio, carry('none', 'electricite', 3));
    const { events } = play(run, 0, -1, 1);
    expect(events.filter((e) => e.type === 'arc').length).toBeGreaterThanOrEqual(2);
    const hp = run.enemies().map((e) => run.sim.world.require(e, Health).hp);
    expect(hp).toEqual([2, 1, 1]);
  });

  it('les arcs ne frappent chaque ennemi qu\'une fois et respectent le rayon', () => {
    const run = RoomRun.fromSpec(trio, carry('rebond', 'electricite', 3));
    const hero = run.hero;
    hero.strongThrow = true;
    const [a] = run.enemies();
    const targets = arcTargets(run.sim.world, hero, a!, 5, 4);
    const ids = targets.map((t) => t.to);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(a);
  });

  it('la jauge se charge aussi avec un élément seul', () => {
    const run = RoomRun.fromSpec(room(), carry('none', 'electricite'));
    const { events } = play(run, 0, -1, 1);
    expect(events.some((e) => e.type === 'charge')).toBe(true);
  });
});

describe('cartes et synergies', () => {
  it('décrit trois formes et des synergies seulement avec l\'élément', () => {
    expect(FORM_CARDS.map((c) => c.id)).toEqual(['pierre', 'rebond', 'glu']);
    expect(synergyLine('pierre', 'none')).toBeNull();
    expect(synergyLine('glu', 'electricite')).toContain('Glu');
  });

  it('la prédiction reste exacte avec chaque forme', () => {
    for (const form of ['pierre', 'rebond', 'glu'] as const) {
      const run = RoomRun.fromSpec(roomById('salle-2'), carry(form, 'electricite', 3));
      const prediction = predictRoomThrow(run, 0.3, -0.95, 1);
      run.throwHero(0.3, -0.95, 1);
      while (run.sim.phase === 'moving') run.stepMotion();
      expect(prediction.stop).toEqual(run.heroPosition());
    }
  });

  it('la Herse reste résoluble avec chaque forme', () => {
    for (const form of ['rebond', 'glu'] as const) {
      const result = solveRoom(roomById('salle-5'), { carry: carry(form), maxTurns: 6 });
      expect(result.solvable).toBe(true);
    }
  }, 60_000);
});
