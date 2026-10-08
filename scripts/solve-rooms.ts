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
import type { RoomSpec } from '../src/sim/room';
import { replaySequence, solveRoom } from '../src/sim/solver';
import { ENTRIES, isTooEasy, startProblems, structuralProblems } from './room-checks';

const ROOMS_DIR = fileURLToPath(new URL('../src/data/rooms/', import.meta.url));

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
      console.error(`INCONNUE ${file} : aucune entrée de carry pour l'identifiant ${spec.id} dans scripts/room-checks.ts`);
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
      if (isTooEasy(result, entry.tutorial === true)) problems.push(`trop facile (ratio du premier tour ${result.firstTurnWinRatio.toFixed(3)})`);
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

  const header = `${pad('salle', 34)}${pad('passe', 16)}${pad('résoluble', 11)}${pad('tours', 7, true)}${pad('ratio 1er', 11, true)}${pad('évals', 8, true)}${pad('durée', 10, true)}`;
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const row of rows) {
    console.log(
      `${pad(row.room, 34)}${pad(row.pass, 16)}${pad(row.solvable ? 'oui' : 'NON', 11)}${pad(row.turns ?? '-', 7, true)}${pad(row.ratio.toFixed(3), 11, true)}${pad(row.evaluations, 8, true)}${pad(`${(row.ms / 1000).toFixed(2)} s`, 10, true)}`,
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
