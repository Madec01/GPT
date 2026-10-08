import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { validateRoomSpec } from '../src/data/schema';
import { contractBroken, contractFulfilled, contractLabel } from '../src/sim/contracts';
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

function play(run: RoomRun, dirX: number, dirY: number, power = 1) {
  expect(run.throwHero(dirX, dirY, power)).toBe(true);
  const events: ReturnType<RoomRun['tick']> = [];
  while (run.phase === 'moving') events.push(...run.tick());
  return events;
}

/** Un crapaud contre le mur du haut : un lancer franc le fait éclater, la salle est gagnée au premier tour. */
const CRAPAUD_MUR = { archetype: 'crapaud', x: 5, y: 1.5 } as const;

describe('contrats secondaires', () => {
  it('sans dégât : rempli à la victoire, un cœur rendu ; rompu dès que Dodu est touché', () => {
    const spec = room({ enemies: [CRAPAUD_MUR], contract: { type: 'sansDegat', reward: 'coeur' } });
    const run = RoomRun.fromSpec(spec, { hp: 2, charge: 0, form: 'none', element: 'none' });
    expect(contractLabel(run.state.contract!, run.state)).toBe('Contrat : sans dégât');
    const events = play(run, 0, -1);
    expect(run.phase).toBe('won');
    expect(events.find((e) => e.type === 'contract')).toMatchObject({ type: 'contract', done: true, reward: 'coeur' });
    expect(run.state.contractDone).toBe(true);
    expect(run.hero.hp).toBe(3);
    expect(run.carry().hp).toBe(3);

    const hurt = RoomRun.fromSpec(spec);
    hurt.state.heroHits = 1;
    expect(contractBroken(hurt.state.contract!, hurt.state)).toBe(true);
    expect(contractLabel(hurt.state.contract!, hurt.state)).toBe('Contrat rompu : sans dégât');
    const hurtEvents = play(hurt, 0, -1);
    expect(hurtEvents.find((e) => e.type === 'contract')).toMatchObject({ done: false });
    expect(hurt.hero.hp).toBe(3);
  });

  it('les coups reçus sont comptés : zone de frappe, explosion, gouffre', () => {
    const attacked = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 5, y: 6.5 }, { archetype: 'gelee', x: 9, y: 1 }] }));
    play(attacked, 0, -1, 0.3);
    expect(attacked.state.heroHits).toBe(1);

    const exploded = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 9, y: 1 }], boxes: [{ x: 5, y: 4, width: 0.9, height: 0.9, breakable: 'explosive' }] }));
    play(exploded, 0, -1);
    expect(exploded.state.heroHits).toBe(1);

    const fallen = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 9, y: 1 }], hazards: [{ kind: 'pit', zone: { kind: 'disc', x: 5, y: 4, r: 1 } }] }));
    play(fallen, 0, -1, 0.5);
    expect(fallen.state.heroHits).toBe(1);
  });

  it('en N tours : rempli si la salle tombe à temps, la jauge est remplie', () => {
    const spec = room({ enemies: [CRAPAUD_MUR], contract: { type: 'tours', max: 1, reward: 'charge' } });
    const run = RoomRun.fromSpec(spec, { hp: 3, charge: 0, form: 'pierre', element: 'none' });
    play(run, 0, -1);
    expect(run.phase).toBe('won');
    expect(run.state.contractDone).toBe(true);
    expect(run.hero.charge).toBe(run.hero.chargeMax);

    const late = RoomRun.fromSpec(spec);
    expect(late.state.turn).toBe(1);
    late.state.turn = 2;
    expect(contractBroken(late.state.contract!, late.state)).toBe(true);
    expect(contractLabel(late.state.contract!, late.state)).toBe('Contrat rompu : en 1 tour au plus');
  });

  it('briser N cassables : compte les casses et affiche l\'avancement', () => {
    const spec = room({
      enemies: [CRAPAUD_MUR],
      boxes: [{ x: 5, y: 5, width: 0.8, height: 0.8, breakable: 'crate' }],
      contract: { type: 'casse', count: 2, reward: 'coeur' },
    });
    const run = RoomRun.fromSpec(spec);
    expect(contractLabel(run.state.contract!, run.state)).toBe('Contrat : briser 2 cassables (0/2)');
    play(run, 0, -1);
    expect(run.state.breaks).toBeGreaterThanOrEqual(1);
    if (run.phase === 'won') {
      expect(run.state.contractDone).toBe(run.state.breaks >= 2);
    } else {
      expect(contractLabel(run.state.contract!, run.state)).toBe(`Contrat : briser 2 cassables (${run.state.breaks}/2)`);
    }
  });

  it('sonner N ennemis d\'un lancer : retient le meilleur lancer', () => {
    const spec = room({
      hero: { x: 5, y: 9 },
      enemies: [{ archetype: 'crapaud', x: 5, y: 6 }, { archetype: 'crapaud', x: 5, y: 3 }],
      contract: { type: 'sonnes', count: 2, reward: 'charge' },
    });
    const run = RoomRun.fromSpec(spec);
    expect(contractFulfilled(run.state.contract!, run.state)).toBe(false);
    const events = play(run, 0, -1);
    const stuns = events.filter((e) => e.type === 'stun').length;
    expect(run.state.bestStuns).toBe(stuns);
    expect(contractLabel(run.state.contract!, run.state).startsWith('Contrat')).toBe(true);
  });

  it('le validateur lit un contrat et refuse une cible absurde', () => {
    const base = JSON.parse(JSON.stringify(GREY_ROOM)) as Record<string, unknown>;
    expect(validateRoomSpec({ ...base, contract: { type: 'tours', max: 3, reward: 'charge' } }).contract).toEqual({ type: 'tours', max: 3, reward: 'charge' });
    expect(() => validateRoomSpec({ ...base, contract: { type: 'casse', count: 0, reward: 'coeur' } })).toThrow(/contract/);
    expect(() => validateRoomSpec({ ...base, contract: { type: 'sieste', reward: 'coeur' } })).toThrow(/contract\.type/);
  });
});
