import { describe, expect, it } from 'vitest';
import { Velocity } from '../src/core/physics';
import { Breakable, Health } from '../src/sim/components';
import type { RoomSpec } from '../src/sim/room';
import { RoomRun } from '../src/sim/rules/turn';

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
  expect(run.throwHero(dirX, dirY, power)).toBe(true);
  const events: ReturnType<RoomRun['tick']> = [];
  while (run.phase === 'moving') events.push(...run.tick());
  return events;
}

/** Lance Dodu vers un point depuis sa position courante. */
function playToward(run: RoomRun, x: number, y: number, power = 1) {
  const h = run.heroPosition();
  const dx = x - h.x;
  const dy = y - h.y;
  const d = Math.hypot(dx, dy);
  return play(run, dx / d, dy / d, power);
}

describe('décor actif : ressort', () => {
  it('renvoie Dodu plus vite qu\'il n\'est arrivé', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE], boxes: [{ x: 5, y: 3, width: 3, height: 0.6, bouncy: true }] }));
    expect(run.throwHero(0, -1, 0.6)).toBe(true);
    let gained = false;
    while (run.phase === 'moving') {
      run.tick();
      for (const c of run.lastContacts) {
        if (c.b !== null) continue;
        const v = run.sim.world.require(c.a, Velocity);
        const after = Math.hypot(v.x, v.y);
        if (c.y < 4 && after > c.aSpeedBefore * 1.1) gained = true;
      }
    }
    expect(gained).toBe(true);
  });

  it('un ressort est une boîte à part entière, sans solidité', () => {
    const run = RoomRun.fromSpec(room({ boxes: [{ x: 5, y: 3, width: 3, height: 0.6, bouncy: true }] }));
    expect(run.sim.world.query(Breakable)).toHaveLength(0);
  });
});

describe('décor actif : explosif', () => {
  const spec = room({
    enemies: [{ archetype: 'gelee', x: 6.5, y: 4 }, FAR_GELEE],
    boxes: [{ x: 5, y: 4, width: 0.9, height: 0.9, breakable: 'explosive' }],
  });

  it('éclate au premier impact : deux points à l\'ennemi voisin, un point à Dodu, poussée', () => {
    const run = RoomRun.fromSpec(spec);
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'break' && e.breakableKind === 'explosive')).toBe(true);
    expect(events.filter((e) => e.type === 'explosion')).toHaveLength(1);
    expect(events.some((e) => e.type === 'damage' && e.amount === 2)).toBe(true);
    expect(events.some((e) => e.type === 'heroHit' && e.amount === 1)).toBe(true);
    expect(run.hero.hp).toBe(2);
    // La gelée voisine, à 2 points de vie, a été tuée par le souffle.
    expect(run.enemies()).toHaveLength(1);
  });

  it('ne blesse pas Dodu invincible et tue Dodu à un point de vie sinon', () => {
    const safe = RoomRun.fromSpec(spec, { hp: 1, charge: 0, form: 'none', element: 'none' });
    safe.state.invincible = true;
    play(safe, 0, -1);
    expect(safe.hero.hp).toBe(1);
    expect(safe.phase).not.toBe('lost');

    const doomed = RoomRun.fromSpec(spec, { hp: 1, charge: 0, form: 'none', element: 'none' });
    play(doomed, 0, -1);
    expect(doomed.hero.hp).toBeLessThanOrEqual(0);
    expect(doomed.phase).toBe('lost');
  });

  it('déclenche les explosifs voisins en chaîne et brise les cassables à portée', () => {
    const run = RoomRun.fromSpec(
      room({
        enemies: [FAR_GELEE],
        boxes: [
          { x: 5, y: 4, width: 0.9, height: 0.9, breakable: 'explosive' },
          { x: 6.6, y: 4, width: 0.9, height: 0.9, breakable: 'explosive' },
          { x: 8, y: 4, width: 0.9, height: 0.9, breakable: 'crate' },
          { x: 2, y: 1, width: 0.9, height: 0.9, breakable: 'crate' },
        ],
      }),
    );
    const events = play(run, 0, -1);
    expect(events.filter((e) => e.type === 'explosion')).toHaveLength(2);
    const broken = events.filter((e) => e.type === 'break');
    expect(broken).toHaveLength(3);
    // La caisse hors de portée des deux souffles reste debout.
    expect(run.sim.world.query(Breakable)).toHaveLength(1);
  });

  it('un lancer trop lent ne le fait pas éclater', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE], boxes: [{ x: 5, y: 7, width: 0.9, height: 0.9, breakable: 'explosive' }] }));
    const events = play(run, 0, -1, 0.15);
    expect(events.some((e) => e.type === 'explosion')).toBe(false);
    expect(run.sim.world.query(Breakable)).toHaveLength(1);
  });
});

describe('usure : barricades et colonnes', () => {
  it('une barricade se fissure à chaque impact et cède au troisième', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE], boxes: [{ x: 5, y: 4, width: 3, height: 0.5, breakable: 'barricade' }] }));
    const [box] = run.sim.world.query(Breakable);
    expect(box).toBeDefined();
    const remaining: number[] = [];
    let broken = false;
    for (let i = 0; i < 6 && !broken; i++) {
      const events = playToward(run, 5, 4, 0.5);
      for (const e of events) {
        if (e.type === 'crack') remaining.push(e.remaining);
        if (e.type === 'break' && e.breakableKind === 'barricade') broken = true;
      }
      if (run.phase !== 'aim') break;
    }
    expect(broken).toBe(true);
    expect(remaining[0]).toBe(2);
    expect(remaining).toEqual([...remaining].sort((a, b) => b - a));
    expect(remaining.at(-1)).toBe(1);
  });

  it('un impact mou ne fissure rien', () => {
    const run = RoomRun.fromSpec(room({ enemies: [FAR_GELEE], boxes: [{ x: 5, y: 6.5, width: 3, height: 0.5, breakable: 'barricade' }] }));
    const events = play(run, 0, -1, 0.2);
    expect(events.some((e) => e.type === 'crack' || e.type === 'break')).toBe(false);
    const [box] = run.sim.world.query(Breakable);
    expect(run.sim.world.require(box!, Breakable).solidity).toBe(3);
  });

  it('un rocher lancé assez vite brise une colonne d\'un coup, sans fissure', () => {
    const run = RoomRun.fromSpec(
      room({
        enemies: [FAR_GELEE],
        pushables: [{ kind: 'boulder', x: 5, y: 6.2 }],
        boxes: [{ x: 5, y: 3, width: 0.6, height: 0.6, breakable: 'column' }],
      }),
    );
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'crack')).toBe(false);
    expect(events.some((e) => e.type === 'break' && e.breakableKind === 'column')).toBe(true);
    expect(run.sim.world.query(Health).length).toBeGreaterThan(0);
  });
});
