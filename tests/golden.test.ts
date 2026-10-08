/**
 * Rejeux dorés : des lancers de référence dont la position d'arrêt et le
 * nombre de pas sont figés dans `tests/golden/throws.json`. Toute dérive de
 * la physique casse ce test. Pour régénérer après un changement voulu :
 * `npm run golden:update`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { Simulation } from '../src/sim/simulation';

interface GoldenThrow {
  vx: number;
  vy: number;
  stopX: number;
  stopY: number;
  steps: number;
  contacts: number;
}

const GOLDEN_PATH = new URL('./golden/throws.json', import.meta.url);
const INPUTS: Array<[number, number]> = [
  [0, -14],
  [7, -11],
  [-7, -11],
  [13, -2],
  [-4, -14],
  [2, 6],
  [10, 10],
  [-13.9, -1],
];

function run(vx: number, vy: number): GoldenThrow {
  const sim = Simulation.fromRoom(GREY_ROOM);
  sim.throwHero(vx, vy);
  const steps = sim.runUntilRest();
  const t = sim.heroTransform();
  return { vx, vy, stopX: t.x, stopY: t.y, steps, contacts: sim.events.length };
}

describe('rejeux dorés', () => {
  const update = process.env['FRONDE_UPDATE_GOLDEN'] === '1';

  it('reproduit exactement les lancers de référence', () => {
    const actual = INPUTS.map(([vx, vy]) => run(vx, vy));
    if (update || !existsSync(GOLDEN_PATH)) {
      writeFileSync(GOLDEN_PATH, JSON.stringify(actual, null, 2) + '\n');
    }
    const expected = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8')) as GoldenThrow[];
    expect(actual).toEqual(expected);
  });
});
