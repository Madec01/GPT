import { describe, expect, it } from 'vitest';
import { CircleBody, Transform, Velocity } from '../src/core/physics';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { Breakable, Enemy, Health, Kind, Pickup } from '../src/sim/components';
import { BOSS_CYCLE, chooseIntent } from '../src/sim/intents';
import type { RoomSpec } from '../src/sim/room';
import { predictRoomThrow, RoomRun } from '../src/sim/rules/turn';
import { disc, rect } from '../src/sim/zones';

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

/** Ennemi lointain dont la zone ne peut pas atteindre le héros, pour garder un objectif non trivial. */
const FAR_GELEE = { archetype: 'gelee', x: 9, y: 1 } as const;

function play(run: RoomRun, dirX: number, dirY: number, power = 1) {
  return playTracked(run, dirX, dirY, power).events;
}

/** Joue un lancer et note le y minimal atteint par le héros. */
function playTracked(run: RoomRun, dirX: number, dirY: number, power = 1) {
  expect(run.throwHero(dirX, dirY, power)).toBe(true);
  const events: ReturnType<RoomRun['tick']> = [];
  let minY = run.heroPosition().y;
  while (run.phase === 'moving') {
    events.push(...run.tick());
    minY = Math.min(minY, run.heroPosition().y);
  }
  return { events, minY };
}

describe('règles : contacts', () => {
  it('le crapaud renvoie Dodu comme un bumper, prend un dégât, puis éclate contre le mur', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'crapaud', x: 5, y: 4 }] }));
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'bumper')).toBe(true);
    expect(events.filter((e) => e.type === 'damage')).toHaveLength(1);
    expect(events.some((e) => e.type === 'death' && e.kind === 'crapaud')).toBe(true);
    expect(run.phase).toBe('won');
    expect(run.heroPosition().y).toBeGreaterThan(4.5);
  });

  it('la gelée arrête Dodu sur place et, bousculée, elle est sonnée', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 5, y: 6.5 }] }));
    const events = play(run, 0, -1, 0.5);
    expect(events.some((e) => e.type === 'stick')).toBe(true);
    expect(events.some((e) => e.type === 'stun')).toBe(true);
    expect(events.some((e) => e.type === 'heroHit')).toBe(false);
    expect(run.hero.hp).toBe(3);
    expect(run.state.turn).toBe(2);
    const [gelee] = run.enemies();
    expect(run.sim.world.require(gelee!, Health).hp).toBe(1);
    // Fin de course immédiate : Dodu s'est arrêté au contact, à un diamètre de la gelée.
    expect(run.heroPosition().y).toBeGreaterThan(7.4);
  });

  it('une gelée projetée à grande vitesse s\'écrase contre le mur et meurt', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 5, y: 4 }] }));
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'death' && e.kind === 'gelee')).toBe(true);
    expect(run.phase).toBe('won');
  });

  it('un ennemi non sonné frappe Dodu dans sa zone annoncée', () => {
    const run = RoomRun.fromSpec(room({ hero: { x: 5, y: 5.6 }, enemies: [{ archetype: 'gelee', x: 5, y: 4 }] }));
    const events = play(run, 1, 0, 0.05);
    expect(events.some((e) => e.type === 'heroHit')).toBe(true);
    expect(run.hero.hp).toBe(2);
    expect(run.phase).toBe('aim');
  });

  it('le rocailleux bouge peu mais assez pour être sonné, et encaisse un dégât', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 4 }] }));
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'damage')).toBe(true);
    expect(events.some((e) => e.type === 'stun')).toBe(true);
    expect(events.some((e) => e.type === 'heroHit')).toBe(false);
  });

  it('une caisse se brise à vitesse suffisante et le butin est déterministe par seed', () => {
    const results = new Map<number, boolean>();
    for (let seed = 1; seed <= 24; seed++) {
      const spec = room({ seed, enemies: [FAR_GELEE], boxes: [{ x: 5, y: 5, width: 1, height: 1, breakable: 'crate' }] });
      const run = RoomRun.fromSpec(spec);
      const events = play(run, 0, -1);
      expect(events.some((e) => e.type === 'break' && e.breakableKind === 'crate')).toBe(true);
      expect(run.sim.world.query(Breakable)).toHaveLength(0);
      const loot = events.some((e) => e.type === 'loot');
      expect(run.sim.world.query(Pickup).length).toBe(loot ? 1 : 0);
      const again = RoomRun.fromSpec(spec);
      expect(play(again, 0, -1).some((e) => e.type === 'loot')).toBe(loot);
      results.set(seed, loot);
    }
    expect([...results.values()].some((v) => v)).toBe(true);
    expect([...results.values()].some((v) => !v)).toBe(true);
  });

  it('une barricade résiste à Dodu normal et cède au Boulet de siège sans le ralentir', () => {
    const spec = room({ enemies: [FAR_GELEE], boxes: [{ x: 5, y: 5, width: 3, height: 0.5, breakable: 'barricade' }] });
    const normal = RoomRun.fromSpec(spec);
    expect(play(normal, 0, -1).some((e) => e.type === 'break')).toBe(false);
    expect(normal.heroPosition().y).toBeGreaterThan(5.25);

    const strong = RoomRun.fromSpec(spec, { hp: 3, charge: 3, form: 'pierre', element: 'none' });
    const { events, minY } = playTracked(strong, 0, -1);
    expect(events.some((e) => e.type === 'break' && e.breakableKind === 'barricade')).toBe(true);
    expect(minY).toBeLessThan(2);
    // La charge a été consommée au lancer puis a recommencé à se remplir sur les rebonds de mur.
    const firstCharge = events.find((e) => e.type === 'charge');
    expect(firstCharge).toMatchObject({ type: 'charge', value: 1 });
    expect(strong.hero.charge).toBeLessThan(3);
  });

  it('la jauge de charge ne compte les rebonds de mur qu\'avec la forme Pierre', () => {
    const spec = room({ enemies: [FAR_GELEE] });
    const pierre = RoomRun.fromSpec(spec, { hp: 3, charge: 0, form: 'pierre', element: 'none' });
    const events = play(pierre, 0, -1);
    expect(events.some((e) => e.type === 'charge' && e.value === 1)).toBe(true);
    expect(pierre.hero.charge).toBe(1);
    const none = RoomRun.fromSpec(spec);
    expect(play(none, 0, -1).some((e) => e.type === 'charge')).toBe(false);
    expect(none.hero.charge).toBe(0);
  });

  it('le boss ignore un coup direct, encaisse un coup fort et deux points par boulet', () => {
    const direct = RoomRun.fromSpec(room({ enemies: [{ archetype: 'boss', x: 5, y: 3 }] }));
    expect(play(direct, 0, -1).some((e) => e.type === 'damage')).toBe(false);

    const strong = RoomRun.fromSpec(room({ enemies: [{ archetype: 'boss', x: 5, y: 3 }] }), { hp: 3, charge: 3, form: 'pierre', element: 'none' });
    const [boss] = strong.enemies();
    play(strong, 0, -1);
    expect(strong.sim.world.require(boss!, Health).hp).toBe(5);

    const boulder = RoomRun.fromSpec(
      room({ enemies: [{ archetype: 'boss', x: 5, y: 3 }], pushables: [{ kind: 'boulder', x: 5, y: 5.5 }] }),
    );
    const [boss2] = boulder.enemies();
    const events = play(boulder, 0, -1);
    expect(events.some((e) => e.type === 'damage' && e.amount === 2)).toBe(true);
    expect(boulder.sim.world.require(boss2!, Health).hp).toBe(4);
  });

  it('une colonne brisée par le Boulet de siège s\'effondre sur le boss', () => {
    const run = RoomRun.fromSpec(
      room({
        hero: { x: 3, y: 8 },
        enemies: [{ archetype: 'boss', x: 5, y: 3 }],
        boxes: [{ x: 3, y: 4.5, width: 0.6, height: 2, breakable: 'column', collapse: disc(5, 3, 2.5) }],
      }),
      { hp: 3, charge: 3, form: 'pierre', element: 'none' },
    );
    const [boss] = run.enemies();
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'break' && e.breakableKind === 'column')).toBe(true);
    expect(run.sim.world.require(boss!, Health).hp).toBe(4);
  });
});

describe('règles : systèmes', () => {
  it('Dodu tombé dans un gouffre perd un point de vie et réapparaît à son point de lancer', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE], hazards: [{ kind: 'pit', zone: disc(5, 3, 1) }] }));
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'fall' && e.kind === 'hero')).toBe(true);
    expect(run.hero.hp).toBe(2);
    expect(run.heroPosition()).toEqual({ x: 5, y: 8 });
  });

  it('un ennemi projeté dans un gouffre meurt', () => {
    const run = RoomRun.fromSpec(
      room({ enemies: [{ archetype: 'crapaud', x: 5, y: 5 }], hazards: [{ kind: 'pit', zone: rect(5, 2, 3, 1.5) }] }),
    );
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'fall' && e.kind === 'crapaud')).toBe(true);
    expect(run.phase).toBe('won');
  });

  it('un tremplin pousse une fois par traversée', () => {
    const run = RoomRun.fromSpec(
      room({ enemies: [FAR_GELEE], springboards: [{ x: 5, y: 6, width: 2, height: 1, dirX: 0, dirY: -1 }] }),
    );
    const events = play(run, 0, -1, 0.5);
    expect(events.filter((e) => e.type === 'spring')).toHaveLength(1);
    expect(run.heroPosition().y).toBeLessThan(3);
  });

  it('un objet poussé entièrement dans la cible remplit l\'objectif', () => {
    const run = RoomRun.fromSpec(
      room({
        enemies: [FAR_GELEE],
        pushables: [{ kind: 'egg', x: 5, y: 5 }],
        objective: { type: 'push', object: 0, goal: { x: 5, y: 2, r: 2.5 } },
      }),
    );
    play(run, 0, -1);
    expect(run.phase).toBe('won');
  });

  it('le frein ne sert qu\'une fois par salle', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE] }));
    run.throwHero(0, -1, 1);
    for (let i = 0; i < 10; i++) run.tick();
    expect(run.brake()).toBe(true);
    expect(run.sim.world.require(run.heroEntity, Velocity)).toEqual({ x: 0, y: 0 });
    while (run.phase === 'moving') run.tick();
    run.throwHero(0, -1, 1);
    for (let i = 0; i < 10; i++) run.tick();
    expect(run.brake()).toBe(false);
  });
});

describe('règles : intentions', () => {
  it('le rocailleux vise devant lui, vers le héros', () => {
    const intent = chooseIntent('rocailleux', { x: 5, y: 5 }, { x: 5, y: 9 }, 0);
    expect(intent.zones[0]).toMatchObject({ kind: 'disc', x: 5, y: 6.6, r: 1.2 });
  });

  it('le boss suit son cycle fixe et le souffle est une bande orientée', () => {
    const patterns = [0, 1, 2, 3, 4].map((i) => chooseIntent('boss', { x: 5, y: 2 }, { x: 5, y: 9 }, i).pattern);
    expect(patterns).toEqual([...BOSS_CYCLE, BOSS_CYCLE[0]]);
    const souffle = chooseIntent('boss', { x: 5, y: 2 }, { x: 5, y: 9 }, 2).zones[0]!;
    expect(souffle.kind).toBe('poly');
    expect(chooseIntent('boss', { x: 5, y: 2 }, { x: 5, y: 9 }, 3).zones).toEqual([]);
  });
});

describe('règles : déterminisme', () => {
  const THROWS: Array<[number, number, number]> = [
    [0, -1, 1],
    [0.45, -0.89, 0.8],
    [-0.6, -0.8, 1],
    [0.95, -0.3, 0.6],
  ];

  it('la prédiction annonce exactement l\'arrêt réel, bumper et collant compris', () => {
    for (const [dx, dy, power] of THROWS) {
      const run = RoomRun.fromSpec(GREY_ROOM);
      const prediction = predictRoomThrow(run, dx, dy, power);
      run.throwHero(dx, dy, power);
      while (run.sim.phase === 'moving') run.stepMotion();
      expect(prediction.stop).toEqual(run.heroPosition());
      expect(prediction.completed).toBe(true);
    }
  });

  it('un clone en plein mouvement poursuit à l\'identique, règles comprises', () => {
    const run = RoomRun.fromSpec(GREY_ROOM);
    run.throwHero(0.2, -0.98, 1);
    for (let i = 0; i < 30; i++) run.tick();
    const clone = run.clone();
    run.runUntilTurnEnd();
    clone.runUntilTurnEnd();
    expect(clone.snapshot()).toBe(run.snapshot());
    expect(clone.state.turn).toBe(run.state.turn);
  });

  it('les ennemis de la salle grise portent leur nature et leur santé', () => {
    const run = RoomRun.fromSpec(GREY_ROOM);
    const kinds = run.enemies().map((e) => run.sim.world.require(e, Kind).kind);
    expect(kinds).toEqual(['crapaud', 'gelee', 'rocailleux']);
    for (const e of run.enemies()) {
      expect(run.sim.world.require(e, Enemy).intent).not.toBeNull();
      expect(run.sim.world.require(e, CircleBody).radius).toBeGreaterThan(0);
      expect(run.sim.world.require(e, Transform)).toBeDefined();
    }
  });
});
