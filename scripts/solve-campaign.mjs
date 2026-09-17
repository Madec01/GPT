/** Generate real, zero-alert campaign replays using only ordinary engine inputs. */
import { Simulation } from '../js/engine.js';
import { LEVELS } from '../js/levels.js';
import fs from 'node:fs';

const STEP = .45;
const LIMIT = 24000;
const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];

class MinHeap {
  constructor() { this.items = []; }
  push(node) {
    const a = this.items;
    let i = a.length;
    a.push(node);
    while (i) {
      const parent = (i - 1) >> 1;
      if (a[parent].priority <= node.priority) break;
      a[i] = a[parent];
      i = parent;
    }
    a[i] = node;
  }
  pop() {
    const a = this.items, result = a[0], last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let child = i * 2 + 1;
        if (child + 1 < a.length && a[child + 1].priority < a[child].priority) child++;
        if (a[child].priority >= last.priority) break;
        a[i] = a[child];
        i = child;
      }
      a[i] = last;
    }
    return result;
  }
}

// Search branches start from faithful copies. Replays never write simulation state.
function copySimulation(source) {
  const copy = Object.create(Simulation.prototype);
  for (const key of Object.keys(source)) {
    copy[key] = ['onEvent', 'level', 'tiles'].includes(key)
      ? source[key] : structuredClone(source[key]);
  }
  return copy;
}

function distanceMap(level, target) {
  const distances = new Map([[`${target.x},${target.y}`, 0]]);
  const queue = [target];
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i], distance = distances.get(`${point.x},${point.y}`);
    for (const [dx, dy] of directions.slice(0, 4)) {
      const x = point.x + dx, y = point.y + dy, key = `${x},${y}`;
      if (level.tiles[y]?.[x] === '.' && !distances.has(key)) {
        distances.set(key, distance + 1);
        queue.push({ x, y });
      }
    }
  }
  return distances;
}

function solveLeg(start, target) {
  const distances = distanceMap(start.level, target);
  const heap = new MinHeap(), visited = new Map();
  const heuristic = sim => distances.get(`${Math.floor(sim.player.x / 48)},${Math.floor(sim.player.y / 48)}`) * STEP;
  heap.push({ sim: start, priority: heuristic(start), previous: null, actions: [] });
  let expanded = 0;
  while (heap.items.length && expanded++ < LIMIT) {
    const node = heap.pop(), sim = node.sim;
    const x = Math.floor(sim.player.x / 48), y = Math.floor(sim.player.y / 48);
    const reached = x === target.x && y === target.y
      && Math.hypot(sim.player.x - (x * 48 + 24), sim.player.y - (y * 48 + 24)) < 2;
    if (sim.state === 'won' || reached) {
      const chunks = [];
      for (let current = node; current.previous; current = current.previous) chunks.unshift(current.actions);
      return { sim, actions: chunks.flat() };
    }
    for (const [dx, dy] of directions) {
      const tx = x + dx, ty = y + dy;
      if (!sim.walkable(tx, ty)) continue;
      const canEmp = sim.charges.emp > 0 && sim.lasers.length && sim.empUntil < sim.time;
      for (const useEmp of canEmp ? [false, true] : [false]) {
        const next = copySimulation(sim), actions = [];
        if (useEmp) {
          next.emp();
          actions.push({ type: 'emp' });
        }
        const wx = tx * 48 + 24, wy = ty * 48 + 24;
        next.setTarget(wx, wy);
        actions.push({ type: 'setTarget', x: wx, y: wy }, { type: 'wait', seconds: STEP });
        next.update(STEP);
        if (next.state === 'lost' || next.alerts > sim.alerts) continue;
        const key = [tx, ty, Math.round(next.time / STEP), next.charges.emp,
          Math.round(Math.max(0, next.empUntil - next.time) * 2), Math.ceil(next.detection * 10)].join(',');
        const cost = next.time - start.time + next.alerts * .9 + next.abilities * .15;
        if (visited.has(key) && visited.get(key) <= cost) continue;
        visited.set(key, cost);
        heap.push({ sim: next, priority: cost + heuristic(next) + next.detection * 1.5, previous: node, actions });
      }
    }
  }
  throw new Error(`Search exhausted in level ${start.level.id} toward ${JSON.stringify(target)}.`);
}

const result = {
  format: 1,
  description: 'Replays déterministes issus du vrai moteur : uniquement ciblage, attente et outils autorisés. Coordonnées en pixels.',
  levels: [],
};
for (const level of LEVELS) {
  let sim = new Simulation(level);
  sim.start();
  const actions = [];
  const order = level.id === 3 ? [2, 0, 1] : level.id === 8 ? [2, 0, 1, 3] : level.loot.map((_, i) => i);
  for (const i of order) {
    if (level.id === 3 && i === 0) {
      // Demonstrate the tutorial's actual diversion, not merely spend a charge.
      const target = { x: 6 * 48 + 24, y: 2 * 48 + 24 };
      sim.decoy(target);
      if (!sim.guards.some(guard => guard.investigatingUntil > sim.time)) throw new Error('Tutorial decoy missed the guard.');
      actions.push({ type: 'decoy', ...target });
    }
    if (sim.loot[i].collected) continue;
    const leg = solveLeg(sim, level.loot[i]);
    sim = leg.sim;
    actions.push(...leg.actions);
  }
  if (sim.state !== 'won') {
    const leg = solveLeg(sim, level.exit);
    sim = leg.sim;
    actions.push(...leg.actions);
  }
  if (sim.state !== 'won') throw new Error(`Level ${level.id} did not finish.`);
  result.levels.push({ id: level.id, title: level.title, stats: sim.stats(), actions });
  console.log(`${level.id}. ${level.title}: ${sim.time.toFixed(2)} s, ${sim.alerts} alertes.`);
}
fs.writeFileSync(new URL('../docs/solutions.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
