import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Simulation } from '../js/engine.js';
import { LEVELS } from '../js/levels.js';

const solutions = JSON.parse(fs.readFileSync(new URL('../docs/solutions.json', import.meta.url), 'utf8'));

test('la preuve de campagne couvre exactement les neuf salles', () => {
  assert.equal(LEVELS.length, 9);
  assert.deepEqual(solutions.levels.map(r => r.id), LEVELS.map(l => l.id));
});

for (const level of LEVELS) {
  test(`campagne réelle : ${level.id}. ${level.title}, trois étoiles sans alerte`, () => {
    const replay = solutions.levels.find(r => r.id === level.id);
    const sim = new Simulation(level);
    sim.start();
    let effectiveDecoy = false;
    let effectiveEmp = false;
    for (const action of replay.actions) {
      assert.notEqual(sim.state, 'lost', 'aucune reprise cachée pendant le parcours');
      switch (action.type) {
        case 'setTarget':
          assert.equal(sim.walkable(Math.floor(action.x / 48), Math.floor(action.y / 48)), true);
          sim.setTarget(action.x, action.y);
          break;
        case 'wait': {
          assert.ok(action.seconds > 0 && action.seconds <= 1);
          const before = { x: sim.player.x, y: sim.player.y, time: sim.time };
          sim.update(action.seconds);
          const traveled = Math.hypot(sim.player.x - before.x, sim.player.y - before.y);
          assert.ok(traveled <= 125 * (sim.time - before.time) + .001, 'déplacement ordinaire sans téléportation');
          assert.equal(sim.free(sim.player.x, sim.player.y), true, 'le joueur reste dans le sol');
          break;
        }
        case 'emp':
          assert.equal(sim.emp(), true, 'charge EMP réellement disponible');
          effectiveEmp ||= sim.empUntil > sim.time;
          break;
        case 'decoy':
          assert.equal(sim.decoy({ x: action.x, y: action.y }), true, 'charge de leurre réellement disponible');
          effectiveDecoy ||= sim.guards.some(g => g.investigatingUntil > sim.time);
          break;
        default:
          assert.fail(`action non autorisée : ${action.type}`);
      }
    }
    assert.equal(sim.state, 'won');
    assert.equal(sim.loot.every(item => item.collected), true);
    assert.equal(sim.alerts, 0);
    assert.equal(sim.stats().stars, 3);
    assert.ok(Math.abs(sim.time - replay.stats.elapsed) < .001);
    assert.ok(sim.charges.decoy >= 0 && sim.charges.emp >= 0);
    if (level.id === 3) assert.equal(effectiveDecoy, true, 'le tutoriel leurre détourne vraiment un garde');
    if (level.id === 4) assert.equal(effectiveEmp, true, 'le tutoriel EMP utilise le brouilleur');
  });
}
