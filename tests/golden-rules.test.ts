/**
 * Rejeu doré au niveau des règles : une séquence fixe de lancers sur la salle
 * grise doit produire exactement le même résumé de partie. Régénération :
 * `FRONDE_UPDATE_GOLDEN=1 npx vitest run tests/golden-rules.test.ts`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { Health } from '../src/sim/components';
import { RoomRun } from '../src/sim/rules/turn';

interface Summary {
  turn: number;
  phase: string;
  hp: number;
  charge: number;
  enemies: Array<{ hp: number; x: number; y: number }>;
  hero: { x: number; y: number };
  events: Record<string, number>;
}

const GOLDEN_PATH = new URL('./golden/rules.json', import.meta.url);
const SEQUENCE: Array<[number, number, number]> = [
  [0.3, -0.95, 1],
  [-0.5, -0.87, 0.8],
  [0.9, -0.44, 1],
  [0, -1, 0.6],
];

function play(): Summary {
  const run = RoomRun.fromSpec(GREY_ROOM, { hp: 3, charge: 0, form: 'pierre' });
  const events: Record<string, number> = {};
  for (const [dx, dy, power] of SEQUENCE) {
    if (run.phase !== 'aim') break;
    run.throwHero(dx, dy, power);
    while (run.phase === 'moving') for (const e of run.tick()) events[e.type] = (events[e.type] ?? 0) + 1;
  }
  return {
    turn: run.state.turn,
    phase: run.phase,
    hp: run.hero.hp,
    charge: run.hero.charge,
    enemies: run.enemies().map((e) => {
      const t = run.sim.world.require(e, Transform);
      return { hp: run.sim.world.require(e, Health).hp, x: t.x, y: t.y };
    }),
    hero: run.heroPosition(),
    events,
  };
}

import { Transform } from '../src/core/physics';

describe('rejeu doré des règles', () => {
  it('reproduit exactement la partie de référence sur la salle grise', () => {
    const actual = play();
    if (process.env['FRONDE_UPDATE_GOLDEN'] === '1' || !existsSync(GOLDEN_PATH)) {
      writeFileSync(GOLDEN_PATH, JSON.stringify(actual, null, 2) + '\n');
    }
    const expected = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8')) as Summary;
    expect(actual).toEqual(expected);
    expect(actual.events['turn']).toBeGreaterThan(0);
  });
});
