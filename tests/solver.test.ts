import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { validateRoomSpec } from '../src/data/schema';
import type { RoomSpec } from '../src/sim/room';
import { directionTable, replaySequence, solveRoom } from '../src/sim/solver';

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

/** Marge large : le solveur peut prendre quelques secondes sur une machine d'intégration lente. */
const SLOW = 60_000;

describe('solveur : table de directions', () => {
  it('donne des vecteurs unitaires distincts, axes compris, sans trigonométrie', () => {
    const table = directionTable(32);
    expect(table).toHaveLength(32);
    for (const d of table) expect(Math.sqrt(d.dirX * d.dirX + d.dirY * d.dirY)).toBeCloseTo(1, 12);
    const keys = new Set(table.map((d) => `${d.dirX.toFixed(9)},${d.dirY.toFixed(9)}`));
    expect(keys.size).toBe(32);
    for (const axis of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      expect(table.some((d) => d.dirX === axis[0] && d.dirY === axis[1])).toBe(true);
    }
  });

  it('arrondit le nombre de directions au multiple de quatre supérieur', () => {
    expect(directionTable(30)).toHaveLength(32);
    expect(directionTable(1)).toHaveLength(4);
  });
});

describe('solveur : résolution', () => {
  it('résout en un tour un crapaud devant un mur, et la séquence rejouée gagne', () => {
    const spec = room({ enemies: [{ archetype: 'crapaud', x: 5, y: 4 }] });
    const result = solveRoom(spec);
    expect(result.solvable).toBe(true);
    expect(result.turns).toBe(1);
    expect(result.sequence).toHaveLength(1);
    expect(result.firstTurnWinRatio).toBeGreaterThan(0);
    expect(replaySequence(spec, result.sequence)).toBe('won');
  });

  it('déclare non résoluble une salle dont l\'ennemi est muré derrière des barricades', () => {
    // Coin haut gauche fermé par deux barricades : sans pouvoir ni projectile, rien n'y entre.
    const spec = room({
      hero: { x: 6, y: 8 },
      enemies: [{ archetype: 'gelee', x: 1.5, y: 1.5 }],
      boxes: [
        { x: 2, y: 3.5, width: 4, height: 0.5, breakable: 'barricade' },
        { x: 3.5, y: 1.875, width: 0.5, height: 3.75, breakable: 'barricade' },
      ],
    });
    const result = solveRoom(spec, { maxTurns: 3, directions: 16, maxEvaluations: 300 });
    expect(result.solvable).toBe(false);
    expect(result.turns).toBeNull();
    expect(result.sequence).toEqual([]);
    expect(result.evaluations).toBeLessThanOrEqual(300);
    expect(result.firstTurnWinRatio).toBe(0);
    expect(result.trivial).toBe(false);
  });

  it('respecte le garde-fou d\'évaluations', () => {
    const spec = room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 3 }] });
    const result = solveRoom(spec, { maxEvaluations: 40 });
    expect(result.evaluations).toBeLessThanOrEqual(40);
  });

  it('est déterministe : deux appels donnent exactement le même résultat', () => {
    const first = solveRoom(GREY_ROOM, { maxEvaluations: 800 });
    const second = solveRoom(GREY_ROOM, { maxEvaluations: 800 });
    expect(second).toEqual(first);
  }, SLOW);

  it('résout la salle grise, et la séquence rejouée gagne', () => {
    const result = solveRoom(GREY_ROOM);
    expect(result.solvable).toBe(true);
    expect(result.turns).toBeGreaterThan(0);
    expect(result.sequence).toHaveLength(result.turns ?? -1);
    expect(replaySequence(GREY_ROOM, result.sequence)).toBe('won');
  }, SLOW);

  it('signale comme triviale une salle que presque tout lancer gagne', () => {
    // Un crapaud collé à un mur dans une arène minuscule : la plupart des lancers l'atteignent.
    const spec = room({
      width: 4,
      height: 4,
      hero: { x: 2, y: 3 },
      enemies: [{ archetype: 'crapaud', x: 2, y: 1.2 }],
    });
    const result = solveRoom(spec);
    expect(result.solvable).toBe(true);
    expect(result.firstTurnWinRatio).toBeGreaterThan(0.25);
    expect(result.trivial).toBe(true);
  }, SLOW);

  it('rejoue une séquence vide comme une salle non commencée', () => {
    expect(replaySequence(room({ enemies: [{ archetype: 'crapaud', x: 5, y: 4 }] }), [])).toBe('aim');
  });
});

describe('salles de la tranche verticale', () => {
  const dir = fileURLToPath(new URL('../src/data/rooms/', import.meta.url));
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  it('compte sept fichiers, tous valides, aux identifiants et graines distincts', () => {
    expect(files).toEqual([
      '01-cour-basse.json',
      '02-chemin-de-ronde.json',
      '03-nurserie-volee.json',
      '04a-forge-du-rempart.json',
      '04b-citerne.json',
      '05-herse.json',
      '06-portier.json',
    ]);
    const specs = files.map((f) => validateRoomSpec(JSON.parse(readFileSync(`${dir}${f}`, 'utf8')), f));
    expect(specs.map((s) => s.id)).toEqual(['salle-1', 'salle-2', 'salle-3', 'salle-4a', 'salle-4b', 'salle-5', 'salle-6']);
    expect(new Set(specs.map((s) => s.seed)).size).toBe(specs.length);
    for (const s of specs) {
      expect(s.width).toBe(9);
      expect(s.height).toBe(14);
      expect(s.enemies.length).toBeLessThanOrEqual(3);
      expect(s.hazards.length).toBeLessThanOrEqual(2);
      expect(s.hero.y).toBeGreaterThan((s.height * 2) / 3);
    }
    expect(specs.find((s) => s.id === 'salle-4a')?.reward).toBe('pierre');
    expect(specs.find((s) => s.id === 'salle-4b')?.healOnEnter).toBe(2);
    expect(specs.find((s) => s.id === 'salle-6')?.enemies.map((e) => e.archetype)).toEqual(['boss']);
  });
});
