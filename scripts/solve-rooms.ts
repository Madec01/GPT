/**
 * Valide et résout toutes les salles de `src/data/rooms/*.json` avec le
 * solveur headless. Termine avec le code 1 si une salle est invalide,
 * non résoluble, triviale, ou si la solution trouvée ne se rejoue pas en
 * victoire.
 *
 * Usage : `npm run solve` (toutes les salles) ou `npm run solve -- salle-5`
 * (celles dont l'identifiant contient l'argument).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateRoomSpec } from '../src/data/schema';
import { ENEMIES, PUSHABLES } from '../src/sim/archetypes';
import { Enemy } from '../src/sim/components';
import { HERO_BODY, type HeroCarry, type RoomSpec } from '../src/sim/room';
import { RoomRun } from '../src/sim/rules/turn';
import { replaySequence, solveRoom } from '../src/sim/solver';
import { circleInsideZone, circleIntersectsZone, pointInZone } from '../src/sim/zones';

const ROOMS_DIR = fileURLToPath(new URL('../src/data/rooms/', import.meta.url));

/** Plafond du ratio du premier tour pour le tutoriel. */
const TUTORIAL_MAX_RATIO = 0.5;

const SANS_POUVOIR: HeroCarry = { hp: 3, charge: 0, form: 'none', element: 'none' };
const AVEC_PIERRE: HeroCarry = { hp: 3, charge: 0, form: 'pierre', element: 'none' };
const AVEC_REBOND: HeroCarry = { hp: 3, charge: 0, form: 'rebond', element: 'none' };
const AVEC_GLU: HeroCarry = { hp: 3, charge: 0, form: 'glu', element: 'none' };
const AVEC_ELECTRICITE: HeroCarry = { hp: 3, charge: 0, form: 'none', element: 'electricite' };
const PIERRE_ELECTRICITE: HeroCarry = { hp: 3, charge: 0, form: 'pierre', element: 'electricite' };

interface Pass {
  label: string;
  carry: HeroCarry;
}

interface Entry {
  /** Passes à résoudre : l'état attendu à l'entrée, puis la branche de récupération. */
  passes: Pass[];
  /** Tutoriel : gagnable en un tour, mais le ratio du premier tour doit rester sous 0,5. */
  tutorial?: boolean;
}

/**
 * Carry attendu à l'entrée de chaque salle. Les salles 5 et 6 se jouent aussi
 * sans pouvoir : le joueur qui a pris la branche de récupération (4B) y
 * arrive sans Pierre, et la tranche doit rester finissable.
 */
const ENTRIES: Record<string, Entry> = {
  'salle-1': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }], tutorial: true },
  'salle-2': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-3': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-4a': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-4b': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-5': {
    passes: [
      { label: 'Pierre', carry: AVEC_PIERRE },
      { label: 'Rebond', carry: AVEC_REBOND },
      { label: 'Glu', carry: AVEC_GLU },
      { label: 'sans pouvoir', carry: SANS_POUVOIR },
    ],
  },
  'salle-6': {
    passes: [
      { label: 'Pierre', carry: AVEC_PIERRE },
      { label: 'Rebond', carry: AVEC_REBOND },
      { label: 'Glu', carry: AVEC_GLU },
      { label: 'Électricité', carry: AVEC_ELECTRICITE },
      { label: 'Pierre + Élec.', carry: PIERRE_ELECTRICITE },
      { label: 'sans pouvoir', carry: SANS_POUVOIR },
    ],
  },
};

interface Row {
  room: string;
  pass: string;
  solvable: boolean;
  turns: number | null;
  ratio: number;
  evaluations: number;
  ms: number;
  problems: string[];
}

/** Contraintes de forme communes à toutes les salles de la tranche. */
function structuralProblems(spec: RoomSpec): string[] {
  const problems: string[] = [];
  if (spec.width !== 9 || spec.height !== 14) problems.push(`arène ${spec.width}x${spec.height} au lieu de 9x14`);
  if (spec.enemies.length > 3) problems.push(`${spec.enemies.length} ennemis (3 au plus)`);
  if (spec.hazards.length > 2) problems.push(`${spec.hazards.length} gouffres (2 au plus)`);
  if (spec.hero.y < (spec.height * 2) / 3) problems.push('le héros ne démarre pas dans le tiers bas');
  return problems;
}

interface Body {
  label: string;
  x: number;
  y: number;
  r: number;
}

/** Début de salle sain : rien ne se chevauche, rien ne naît dans un gouffre ou une zone de frappe. */
function startProblems(spec: RoomSpec): string[] {
  const problems: string[] = [];
  const bodies: Body[] = [
    { label: 'héros', x: spec.hero.x, y: spec.hero.y, r: HERO_BODY.radius },
    ...spec.enemies.map((e, i) => ({ label: `ennemi ${i} (${e.archetype})`, x: e.x, y: e.y, r: ENEMIES[e.archetype].radius })),
    ...spec.pushables.map((p, i) => ({ label: `poussable ${i} (${p.kind})`, x: p.x, y: p.y, r: PUSHABLES[p.kind].radius })),
  ];
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i]!;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j]!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) problems.push(`${a.label} chevauche ${b.label}`);
    }
    for (const [k, box] of spec.boxes.entries()) {
      const qx = Math.max(box.x - box.width / 2, Math.min(a.x, box.x + box.width / 2));
      const qy = Math.max(box.y - box.height / 2, Math.min(a.y, box.y + box.height / 2));
      if (Math.hypot(a.x - qx, a.y - qy) < a.r) problems.push(`${a.label} chevauche la boîte ${k}`);
    }
    for (const hazard of spec.hazards) {
      if (pointInZone(a.x, a.y, hazard.zone)) problems.push(`${a.label} naît dans un gouffre`);
    }
  }
  const run = RoomRun.fromSpec(spec);
  for (const entity of run.enemies()) {
    const intent = run.sim.world.require(entity, Enemy).intent;
    for (const zone of intent?.zones ?? []) {
      if (circleIntersectsZone(spec.hero.x, spec.hero.y, HERO_BODY.radius, zone)) problems.push('le héros démarre dans une zone de frappe annoncée');
    }
  }
  if (spec.objective.type === 'push') {
    const object = spec.pushables[spec.objective.object]!;
    const goal = { kind: 'disc', ...spec.objective.goal } as const;
    if (circleInsideZone(object.x, object.y, PUSHABLES[object.kind].radius, goal)) problems.push('l\'objet poussable démarre déjà dans la cible');
  }
  return problems;
}

function pad(value: string | number, width: number, right = false): string {
  const s = String(value);
  return right ? s.padStart(width) : s.padEnd(width);
}

function main(): number {
  const filters = process.argv.slice(2);
  const files = readdirSync(ROOMS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    console.error(`Aucune salle JSON dans ${ROOMS_DIR}`);
    return 1;
  }

  const rows: Row[] = [];
  const seeds = new Map<number, string>();
  const ids = new Set<string>();
  let failed = false;
  const started = performance.now();

  for (const file of files) {
    let spec: RoomSpec;
    try {
      spec = validateRoomSpec(JSON.parse(readFileSync(`${ROOMS_DIR}${file}`, 'utf8')), file);
    } catch (error) {
      console.error(`INVALIDE ${file} : ${error instanceof Error ? error.message : String(error)}`);
      failed = true;
      continue;
    }
    if (filters.length > 0 && !filters.some((f) => spec.id.includes(f))) continue;

    const shared: string[] = [...structuralProblems(spec), ...startProblems(spec)];
    const sameSeed = seeds.get(spec.seed);
    if (sameSeed !== undefined) shared.push(`seed ${spec.seed} déjà utilisé par ${sameSeed}`);
    seeds.set(spec.seed, spec.id);
    if (ids.has(spec.id)) shared.push('identifiant en double');
    ids.add(spec.id);

    const entry = ENTRIES[spec.id];
    if (!entry) {
      console.error(`INCONNUE ${file} : aucune entrée de carry pour l'identifiant ${spec.id} dans scripts/solve-rooms.ts`);
      failed = true;
      continue;
    }

    for (const pass of entry.passes) {
      const t0 = performance.now();
      const result = solveRoom(spec, { carry: pass.carry });
      const ms = performance.now() - t0;
      const problems = [...shared];
      if (!result.solvable) problems.push('non résoluble');
      else if (replaySequence(spec, result.sequence, pass.carry) !== 'won') problems.push('la solution ne se rejoue pas en victoire');
      const tooEasy = entry.tutorial ? result.firstTurnWinRatio >= TUTORIAL_MAX_RATIO : result.trivial;
      if (tooEasy) problems.push(`trop facile (ratio du premier tour ${result.firstTurnWinRatio.toFixed(3)})`);
      if (problems.length > 0) failed = true;
      rows.push({
        room: `${spec.id} ${spec.name}`,
        pass: pass.label,
        solvable: result.solvable,
        turns: result.turns,
        ratio: result.firstTurnWinRatio,
        evaluations: result.evaluations,
        ms,
        problems,
      });
    }
  }

  const header = `${pad('salle', 34)}${pad('passe', 14)}${pad('résoluble', 11)}${pad('tours', 7, true)}${pad('ratio 1er', 11, true)}${pad('évals', 8, true)}${pad('durée', 10, true)}`;
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const row of rows) {
    console.log(
      `${pad(row.room, 34)}${pad(row.pass, 14)}${pad(row.solvable ? 'oui' : 'NON', 11)}${pad(row.turns ?? '-', 7, true)}${pad(row.ratio.toFixed(3), 11, true)}${pad(row.evaluations, 8, true)}${pad(`${(row.ms / 1000).toFixed(2)} s`, 10, true)}`,
    );
  }
  for (const row of rows) {
    for (const problem of row.problems) console.error(`PROBLÈME ${row.room} (${row.pass}) : ${problem}`);
  }
  const total = (performance.now() - started) / 1000;
  console.log(`\n${rows.length} résolutions en ${total.toFixed(1)} s, ${failed ? 'ÉCHEC' : 'tout est résoluble'}.`);
  return failed ? 1 : 0;
}

process.exitCode = main();
