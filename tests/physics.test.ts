import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/math/rng';
import { BoxShape, CircleBody, Transform, Velocity } from '../src/core/physics';
import { Simulation, DEFAULT_SIM } from '../src/sim/simulation';
import { box, circle, emptyRoom } from './helpers';

const NO_DECEL = { ...emptyRoom().hero, rollingDecel: 0 };

describe('physique : murs', () => {
  it('rebondit sur un mur avec la restitution attendue et ne le traverse jamais', () => {
    const sim = Simulation.fromRoom(emptyRoom({ hero: { ...NO_DECEL, x: 5, y: 5, restitution: 1 } }));
    sim.throwHero(8, 0);
    let maxX = 0;
    for (let i = 0; i < 120; i++) {
      sim.tick();
      maxX = Math.max(maxX, sim.heroTransform().x);
    }
    expect(maxX).toBeLessThanOrEqual(10 - 0.5 + 1e-9);
    expect(sim.world.require(sim.hero, Velocity).x).toBeCloseTo(-8, 9);
  });

  it('perd de la vitesse normale selon la restitution', () => {
    const sim = Simulation.fromRoom(emptyRoom({ wallRestitution: 0.5, hero: { ...NO_DECEL, x: 5, y: 5, restitution: 0.5 } }));
    sim.throwHero(0, 6);
    for (let i = 0; i < 240; i++) sim.tick();
    expect(sim.world.require(sim.hero, Velocity).y).toBeCloseTo(-3, 9);
  });
});

describe('physique : cercles', () => {
  it('échange les vitesses dans un choc frontal élastique entre masses égales', () => {
    const sim = Simulation.fromRoom(
      emptyRoom({ hero: { ...NO_DECEL, x: 2, y: 5, restitution: 1 }, circles: [circle({ x: 6, y: 5 })] }),
    );
    sim.throwHero(4, 0);
    for (let i = 0; i < 180; i++) sim.tick();
    const heroV = sim.world.require(sim.hero, Velocity);
    const other = sim.world.query(Transform, CircleBody).find((e) => e !== sim.hero)!;
    const otherV = sim.world.require(other, Velocity);
    expect(heroV.x).toBeCloseTo(0, 9);
    expect(otherV.x).toBeCloseTo(4, 9);
  });

  it('conserve la quantité de mouvement entre masses différentes', () => {
    const sim = Simulation.fromRoom(
      emptyRoom({ hero: { ...NO_DECEL, x: 2, y: 5, restitution: 0.5 }, circles: [circle({ x: 6, y: 5, mass: 3, restitution: 0.5 })] }),
    );
    sim.throwHero(4, 0);
    for (let i = 0; i < 120; i++) sim.tick();
    const other = sim.world.query(Transform, CircleBody).find((e) => e !== sim.hero)!;
    const p = sim.world.require(sim.hero, Velocity).x * 1 + sim.world.require(other, Velocity).x * 3;
    expect(p).toBeCloseTo(4, 9);
    expect(sim.world.require(sim.hero, Velocity).x).toBeLessThan(0);
  });
});

describe('physique : roulement et arrêt', () => {
  it('décélère linéairement puis s\'arrête net sous la vitesse de sommeil', () => {
    const sim = Simulation.fromRoom(emptyRoom({ hero: { ...NO_DECEL, x: 5, y: 5, rollingDecel: 6 } }));
    sim.throwHero(3, 0);
    sim.tick();
    expect(sim.world.require(sim.hero, Velocity).x).toBeCloseTo(3 - 6 / 120, 12);
    const steps = sim.runUntilRest();
    expect(sim.phase).toBe('idle');
    expect(steps).toBeLessThanOrEqual(61);
    expect(sim.world.require(sim.hero, Velocity)).toEqual({ x: 0, y: 0 });
  });

  it('refuse un lancer pendant un mouvement et plafonne la vitesse', () => {
    const sim = Simulation.fromRoom(emptyRoom());
    expect(sim.throwHero(100, 0)).toBe(true);
    expect(sim.world.require(sim.hero, Velocity).x).toBe(DEFAULT_SIM.maxSpeed);
    expect(sim.throwHero(1, 0)).toBe(false);
  });
});

describe('physique : aucune traversée', () => {
  it('reste dans l\'arène et hors des boîtes sur 150 lancers aléatoires à vitesse maximale', () => {
    const rng = createRng(2026);
    const spec = emptyRoom({
      hero: { ...NO_DECEL, x: 5, y: 8, restitution: 0.9 },
      circles: [circle({ x: 3, y: 3, mass: 0.6, restitution: 0.95 }), circle({ x: 7, y: 4, mass: 3, restitution: 0.3 })],
      boxes: [box(5, 5, 1, 1), box(2, 6.5, 2, 0.25), box(8, 7, 0.25, 2)],
    });
    const violations: string[] = [];
    let checkedSteps = 0;
    for (let throwIndex = 0; throwIndex < 150; throwIndex++) {
      const sim = Simulation.fromRoom(spec);
      const angle = rng.next() * 2 - 1;
      const vx = DEFAULT_SIM.maxSpeed * angle;
      const vy = Math.sqrt(Math.max(0, DEFAULT_SIM.maxSpeed * DEFAULT_SIM.maxSpeed - vx * vx)) * (rng.next() < 0.5 ? -1 : 1);
      sim.throwHero(vx, vy);
      const boxes = sim.world.query(Transform, BoxShape).map((e) => ({
        t: sim.world.require(e, Transform),
        b: sim.world.require(e, BoxShape),
      }));
      const bodies = sim.world.query(Transform, CircleBody).map((e) => ({
        t: sim.world.require(e, Transform),
        r: sim.world.require(e, CircleBody).radius,
      }));
      for (let step = 0; step < 360 && sim.phase === 'moving'; step++) {
        sim.tick();
        checkedSteps++;
        for (const { t, r } of bodies) {
          if (t.x < r - 1e-6 || t.x > spec.width - r + 1e-6 || t.y < r - 1e-6 || t.y > spec.height - r + 1e-6) {
            violations.push(`lancer ${throwIndex} pas ${step} : hors arène (${t.x}, ${t.y})`);
          }
          for (const { t: bt, b } of boxes) {
            const cx = Math.max(bt.x - b.halfWidth, Math.min(t.x, bt.x + b.halfWidth));
            const cy = Math.max(bt.y - b.halfHeight, Math.min(t.y, bt.y + b.halfHeight));
            const dist = Math.hypot(t.x - cx, t.y - cy);
            if (dist < r - 1e-6) violations.push(`lancer ${throwIndex} pas ${step} : dans une boîte (${t.x}, ${t.y})`);
          }
        }
      }
    }
    expect(checkedSteps).toBeGreaterThan(10000);
    expect(violations).toEqual([]);
  }, 30000);
});
