import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { predictThrow } from '../src/sim/lookahead';
import { replay } from '../src/sim/replay';
import { Simulation } from '../src/sim/simulation';

const THROWS: Array<[number, number]> = [
  [0, -14],
  [6, -12],
  [-9, -9],
  [12, 4],
  [-3, -13.5],
];

describe('déterminisme', () => {
  it('deux exécutions du même lancer donnent le même état, à l\'octet près', () => {
    for (const [vx, vy] of THROWS) {
      const a = Simulation.fromRoom(GREY_ROOM);
      const b = Simulation.fromRoom(GREY_ROOM);
      a.throwHero(vx, vy);
      b.throwHero(vx, vy);
      a.runUntilRest();
      b.runUntilRest();
      expect(a.snapshot()).toBe(b.snapshot());
      expect(a.events.length).toBeGreaterThan(0);
    }
  });

  it('un clone en plein mouvement poursuit exactement comme l\'original', () => {
    const sim = Simulation.fromRoom(GREY_ROOM);
    sim.throwHero(5, -13);
    for (let i = 0; i < 40; i++) sim.tick();
    const clone = sim.clone();
    sim.runUntilRest();
    clone.runUntilRest();
    expect(clone.snapshot()).toBe(sim.snapshot());
  });

  it('la prédiction annonce exactement la position d\'arrêt réelle', () => {
    for (const [vx, vy] of THROWS) {
      const sim = Simulation.fromRoom(GREY_ROOM);
      const prediction = predictThrow(sim, vx, vy);
      expect(prediction.completed).toBe(true);
      sim.throwHero(vx, vy);
      sim.runUntilRest();
      const t = sim.heroTransform();
      expect(prediction.stop).toEqual({ x: t.x, y: t.y });
      expect(prediction.path[0]).toEqual({ x: GREY_ROOM.hero.x, y: GREY_ROOM.hero.y });
      expect(sim.phase).toBe('idle');
    }
  });

  it('la prédiction ne modifie pas la simulation interrogée', () => {
    const sim = Simulation.fromRoom(GREY_ROOM);
    const before = sim.snapshot();
    predictThrow(sim, 8, -8);
    expect(sim.snapshot()).toBe(before);
  });

  it('le rejeu du journal d\'entrées reproduit la partie, frein compris', () => {
    const sim = Simulation.fromRoom(GREY_ROOM);
    sim.throwHero(4, -14);
    for (let i = 0; i < 30; i++) sim.tick();
    sim.brake();
    sim.runUntilRest();
    sim.throwHero(-10, -6);
    sim.runUntilRest();
    const replayed = replay(GREY_ROOM, sim.inputs);
    expect(replayed.snapshot()).toBe(sim.snapshot());
    expect(replayed.inputs).toEqual(sim.inputs);
  });

  it('le premier contact est signalé avec un corps mobile quand le trajet en touche un', () => {
    const sim = Simulation.fromRoom(GREY_ROOM);
    const straightUp = predictThrow(sim, 0, -14);
    expect(straightUp.firstContact).not.toBeNull();
    expect(straightUp.touchedDynamic).toBe(true);
  });
});
