/**
 * Solveur headless de salles : recherche en faisceau, tour par tour.
 *
 * À chaque profondeur, chaque état gardé joue tous les lancers candidats
 * (une table de directions fois une liste de puissances) sur un clone de la
 * salle. Les défaites sont écartées, la première victoire est renvoyée, les
 * autres états sont classés par une heuristique puis tronqués à la largeur du
 * faisceau.
 *
 * Le solveur est déterministe : la table de directions est construite sans
 * trigonométrie (paramétrisation rationnelle du cercle), l'ordre de parcours
 * est fixe et toutes les égalités sont tranchées par l'index du candidat. Il
 * ne lit aucune horloge ; les mesures de durée vivent dans `scripts/`.
 *
 * Un verdict "non résoluble" signifie seulement qu'aucune solution n'a été
 * trouvée dans le budget : la recherche est incomplète par construction. Un
 * verdict "résoluble" est une preuve, la séquence se rejoue avec
 * `replaySequence`.
 */
import { Transform } from '../core/physics';
import { Breakable, Health, Pushable, type RoomPhase } from './components';
import { DEFAULT_CARRY, type HeroCarry, type RoomSpec } from './room';
import { RoomRun } from './rules/turn';
import type { Zone } from './zones';

/** Un lancer : direction unitaire et puissance dans [0, 1]. */
export interface SolverThrow {
  dirX: number;
  dirY: number;
  power: number;
}

export interface SolverOptions {
  /** État du héros à l'entrée de la salle. */
  carry?: HeroCarry;
  /** Nombre de tours maximal d'une solution (défaut 8). */
  maxTurns?: number;
  /** Nombre de directions candidates par tour, arrondi au multiple de 4 supérieur (défaut 32). */
  directions?: number;
  /** Puissances candidates (défaut 0,45 ; 0,7 ; 1). */
  powers?: readonly number[];
  /** Nombre d'états gardés à chaque profondeur (défaut 8). */
  beamWidth?: number;
  /** Garde-fou : nombre maximal de lancers évalués (défaut 6000). */
  maxEvaluations?: number;
}

export interface SolverResult {
  solvable: boolean;
  /** Nombre de tours de la solution trouvée, ou null. */
  turns: number | null;
  /** Lancers de la solution, vide si aucune n'a été trouvée. */
  sequence: SolverThrow[];
  /** Nombre de lancers évalués, premier tour compris. */
  evaluations: number;
  /** Part des lancers candidats du premier tour qui gagnent immédiatement. */
  firstTurnWinRatio: number;
  /** Vrai si `firstTurnWinRatio` dépasse 0,25 : la salle se gagne presque au hasard. */
  trivial: boolean;
}

/**
 * Valeurs par défaut. Mesure en Node 22 : environ 1,2 ms par lancer évalué sur
 * les salles de la tranche, donc le budget de 6000 lancers coûte au plus une
 * dizaine de secondes pour une salle non résoluble. Un faisceau de 4 laissait
 * la forge (salle 4A) hors d'atteinte ; 8 la résout avec une marge de deux.
 */
export const SOLVER_DEFAULTS = {
  maxTurns: 8,
  directions: 32,
  powers: [0.45, 0.7, 1] as readonly number[],
  beamWidth: 8,
  maxEvaluations: 6000,
} as const;

/** Seuil au-delà duquel une salle est jugée triviale. */
export const TRIVIAL_RATIO = 0.25;

/**
 * Directions unitaires réparties sur le cercle sans trigonométrie. Dans le
 * premier quadrant, t = k / m donne le point ((1 - t²) / (1 + t²), 2t / (1 + t²)) ;
 * les trois autres quadrants s'en déduisent par rotations de 90 degrés. Les
 * quatre directions des axes en font toujours partie.
 */
export function directionTable(count: number): Array<{ dirX: number; dirY: number }> {
  const perQuadrant = Math.max(1, Math.ceil(count / 4));
  const table: Array<{ dirX: number; dirY: number }> = [];
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    for (let k = 0; k < perQuadrant; k++) {
      const t = k / perQuadrant;
      const d = 1 + t * t;
      let x = (1 - t * t) / d;
      let y = (2 * t) / d;
      for (let r = 0; r < quadrant; r++) {
        const nx = -y;
        y = x;
        x = nx;
      }
      // `+ 0` normalise un éventuel -0.
      table.push({ dirX: x + 0, dirY: y + 0 });
    }
  }
  return table;
}

/** Critères de classement d'un état, plus petit est meilleur après application de `compareScores`. */
interface Score {
  /** PV ennemis restants. */
  enemyHp: number;
  heroHp: number;
  /** Distance de l'objet poussable à la cible, 0 pour l'objectif éliminer. */
  pushDistance: number;
  /** Distance moyenne de Dodu aux ennemis vivants. */
  heroGap: number;
}

interface Node {
  run: RoomRun;
  sequence: SolverThrow[];
  score: Score;
  /** Index du candidat dans l'ordre de parcours, pour trancher les égalités. */
  order: number;
}

/** Centre d'une zone : le centre d'un disque, la moyenne des sommets d'un polygone. */
function zoneCenter(zone: Zone): { x: number; y: number } {
  if (zone.kind === 'disc') return { x: zone.x, y: zone.y };
  let x = 0;
  let y = 0;
  for (const p of zone.points) {
    x += p.x;
    y += p.y;
  }
  const n = zone.points.length;
  return { x: x / n, y: y / n };
}

function scoreRun(run: RoomRun): Score {
  const { world } = run.sim;
  const enemies = run.enemies();
  const hero = run.heroPosition();
  let enemyHp = 0;
  let gap = 0;
  for (const e of enemies) {
    enemyHp += world.require(e, Health).hp;
    const t = world.require(e, Transform);
    const dx = t.x - hero.x;
    const dy = t.y - hero.y;
    gap += Math.sqrt(dx * dx + dy * dy);
  }
  let pushDistance = 0;
  const objective = run.state.objective;
  if (objective.type === 'push' && world.exists(objective.object)) {
    const t = world.require(objective.object, Transform);
    const goal = zoneCenter(objective.goal);
    const dx = t.x - goal.x;
    const dy = t.y - goal.y;
    pushDistance = Math.sqrt(dx * dx + dy * dy);
  }
  return {
    enemyHp,
    heroHp: run.hero.hp,
    pushDistance,
    heroGap: enemies.length === 0 ? 0 : gap / enemies.length,
  };
}

/** Négatif si `a` est meilleur que `b`. */
function compareScores(pushObjective: boolean, a: Score, b: Score): number {
  if (pushObjective) {
    // Distance au quart d'unité près, puis santé de Dodu, puis distance exacte.
    const qa = Math.round(a.pushDistance * 4);
    const qb = Math.round(b.pushDistance * 4);
    return (
      qa - qb ||
      b.heroHp - a.heroHp ||
      a.pushDistance - b.pushDistance ||
      a.enemyHp - b.enemyHp ||
      a.heroGap - b.heroGap
    );
  }
  return a.enemyHp - b.enemyHp || b.heroHp - a.heroHp || a.heroGap - b.heroGap;
}

/** Empreinte grossière d'un état, pour ne pas garder deux fois le même résultat. */
function signature(run: RoomRun): string {
  const { world } = run.sim;
  const q = (v: number): number => Math.round(v * 50);
  const hero = run.heroPosition();
  const parts: Array<number | string> = [q(hero.x), q(hero.y), run.hero.hp, run.hero.charge];
  for (const e of run.enemies()) {
    const t = world.require(e, Transform);
    parts.push(e, q(t.x), q(t.y), world.require(e, Health).hp);
  }
  for (const p of world.query(Pushable, Transform)) {
    const t = world.require(p, Transform);
    parts.push(`p${p}`, q(t.x), q(t.y));
  }
  parts.push(`b${world.query(Breakable).join('.')}`);
  return parts.join(',');
}

/** Joue un lancer sur un clone de l'état donné. */
function playThrow(parent: RoomRun, move: SolverThrow): RoomRun {
  const run = parent.clone();
  run.throwHero(move.dirX, move.dirY, move.power);
  run.runUntilTurnEnd();
  return run;
}

export function solveRoom(spec: RoomSpec, options: SolverOptions = {}): SolverResult {
  const carry = options.carry ?? DEFAULT_CARRY;
  const maxTurns = options.maxTurns ?? SOLVER_DEFAULTS.maxTurns;
  const powers = options.powers ?? SOLVER_DEFAULTS.powers;
  const beamWidth = Math.max(1, options.beamWidth ?? SOLVER_DEFAULTS.beamWidth);
  const maxEvaluations = options.maxEvaluations ?? SOLVER_DEFAULTS.maxEvaluations;
  const directions = directionTable(options.directions ?? SOLVER_DEFAULTS.directions);

  const candidates: SolverThrow[] = [];
  for (const d of directions) for (const power of powers) candidates.push({ dirX: d.dirX, dirY: d.dirY, power });

  const root = RoomRun.fromSpec(spec, carry);
  const pushObjective = root.state.objective.type === 'push';
  const compare = (a: Node, b: Node): number => compareScores(pushObjective, a.score, b.score) || a.order - b.order;

  let evaluations = 0;
  let firstTurnWins = 0;
  let firstTurnTried = 0;
  let beam: Array<{ run: RoomRun; sequence: SolverThrow[] }> = [{ run: root, sequence: [] }];

  const finish = (sequence: SolverThrow[] | null): SolverResult => {
    const ratio = firstTurnTried === 0 ? 0 : firstTurnWins / firstTurnTried;
    return {
      solvable: sequence !== null,
      turns: sequence === null ? null : sequence.length,
      sequence: sequence ?? [],
      evaluations,
      firstTurnWinRatio: ratio,
      trivial: ratio > TRIVIAL_RATIO,
    };
  };

  for (let depth = 1; depth <= maxTurns; depth++) {
    const next: Node[] = [];
    const seen = new Set<string>();
    let order = 0;
    let firstWin: SolverThrow[] | null = null;

    for (const parent of beam) {
      for (const move of candidates) {
        if (evaluations >= maxEvaluations) {
          // Budget épuisé : on ne conclut que sur ce qui a déjà été trouvé.
          return finish(firstWin);
        }
        evaluations++;
        const run = playThrow(parent.run, move);
        const index = order++;
        if (depth === 1) firstTurnTried++;
        if (run.phase === 'lost') continue;
        const sequence = [...parent.sequence, move];
        if (run.phase === 'won') {
          if (depth === 1) {
            firstTurnWins++;
            firstWin ??= sequence;
            continue;
          }
          return finish(sequence);
        }
        const key = signature(run);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ run, sequence, score: scoreRun(run), order: index });
      }
    }

    // Au premier tour, tous les lancers ont été évalués pour mesurer le ratio.
    if (firstWin) return finish(firstWin);
    if (next.length === 0) return finish(null);
    next.sort(compare);
    beam = next.slice(0, beamWidth);
  }
  return finish(null);
}

/** Rejoue une séquence de lancers depuis le début de la salle et renvoie la phase finale. */
export function replaySequence(spec: RoomSpec, sequence: readonly SolverThrow[], carry: HeroCarry = DEFAULT_CARRY): RoomPhase {
  const run = RoomRun.fromSpec(spec, carry);
  for (const move of sequence) {
    if (!run.throwHero(move.dirX, move.dirY, move.power)) break;
    run.runUntilTurnEnd();
  }
  return run.phase;
}
