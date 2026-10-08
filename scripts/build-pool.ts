/**
 * Construit le vivier de salles du mode roguelite : pour chacune des quatorze
 * salles de `src/data/rooms/*.json`, des variantes (miroir horizontal, échange
 * crapaud ↔ gelée, les deux) validées par le solveur headless, écrites dans
 * `src/data/pool.generated.json`.
 *
 * Usage :
 *   npm run pool            régénère et écrit le fichier ;
 *   npm run pool -- --check régénère en mémoire et échoue si le résultat
 *                           diffère du fichier commité, sans rien écrire.
 *
 * Termine avec le code 1 si une salle source n'a aucune variante retenue, ou
 * en mode --check si le fichier commité est périmé.
 *
 * Tout est déterministe : variantes énumérées dans un ordre fixe, graines
 * décalées par variante, solveur sans horloge ni hasard.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { PoolEntry, PoolFile, PoolKind, PoolTier, PoolVariant } from '../src/data/pool';
import { validateRoomSpec } from '../src/data/schema';
import type { Archetype } from '../src/sim/archetypes';
import type { BoxSpec, EnemySpec, HazardSpec, RoomSpec, SpringboardSpec } from '../src/sim/room';
import { replaySequence, solveRoom, type SolverOptions } from '../src/sim/solver';
import type { Zone } from '../src/sim/zones';
import { ENTRIES, SANS_POUVOIR, isTooEasy, startProblems, structuralProblems } from './room-checks';

const ROOMS_DIR = fileURLToPath(new URL('../src/data/rooms/', import.meta.url));
const POOL_FILE = fileURLToPath(new URL('../src/data/pool.generated.json', import.meta.url));

/** Palier et genre de chaque salle source. Une salle absente de la table fait échouer la génération. */
const TIERS: Record<string, { tier: PoolTier; kind: PoolKind }> = {
  'salle-1': { tier: 1, kind: 'combat' },
  'salle-2': { tier: 1, kind: 'combat' },
  'salle-3': { tier: 1, kind: 'combat' },
  'salle-4a': { tier: 2, kind: 'combat' },
  'salle-4b': { tier: 2, kind: 'combat' },
  'salle-5': { tier: 2, kind: 'combat' },
  'salle-6': { tier: 1, kind: 'boss' },
  'terrasse-1': { tier: 2, kind: 'combat' },
  'terrasse-2': { tier: 2, kind: 'combat' },
  'terrasse-3': { tier: 2, kind: 'combat' },
  'terrasse-4a': { tier: 3, kind: 'combat' },
  'terrasse-4b': { tier: 3, kind: 'combat' },
  'terrasse-5': { tier: 3, kind: 'combat' },
  'terrasse-6': { tier: 2, kind: 'boss' },
};

/**
 * Variantes dans l'ordre d'énumération. Le décalage de graine est ajouté à la
 * graine de la source ; les graines des sources sont toutes sous 100 000, donc
 * les graines du vivier restent distinctes deux à deux.
 */
const VARIANTS: ReadonlyArray<{ variant: PoolVariant; mirror: boolean; swap: boolean; seedOffset: number }> = [
  { variant: 'base', mirror: false, swap: false, seedOffset: 0 },
  { variant: 'm', mirror: true, swap: false, seedOffset: 100_000 },
  { variant: 's1', mirror: false, swap: true, seedOffset: 200_000 },
  { variant: 'ms1', mirror: true, swap: true, seedOffset: 300_000 },
];

/**
 * Options du solveur : celles de `solve-rooms.ts` (valeurs par défaut), avec
 * l'état d'entrée sans pouvoir. La passe SANS_POUVOIR suffit au vivier : une
 * salle tirée en cours de run ne suppose aucune forme ni élément.
 */
const SOLVER_OPTIONS: SolverOptions = { carry: SANS_POUVOIR };

const SWAPPED: Partial<Record<Archetype, Archetype>> = { crapaud: 'gelee', gelee: 'crapaud' };

/** Arrondi au millionième : évite les 7.1000000000000005 du `width - x`, et normalise -0. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6 + 0;
}

function mirrorX(x: number, width: number): number {
  return round(width - x);
}

/**
 * Miroir d'une zone. Un polygone voit son sens de parcours s'inverser par la
 * symétrie : on renverse la liste des points pour garder le sens d'origine
 * (convexe, sommets dans le même ordre cyclique que la source).
 */
function mirrorZone(zone: Zone, width: number): Zone {
  if (zone.kind === 'disc') return { kind: 'disc', x: mirrorX(zone.x, width), y: zone.y, r: zone.r };
  return { kind: 'poly', points: zone.points.map((p) => ({ x: mirrorX(p.x, width), y: p.y })).reverse() };
}

function mirrorRoom(spec: RoomSpec): RoomSpec {
  const w = spec.width;
  return {
    ...spec,
    hero: { x: mirrorX(spec.hero.x, w), y: spec.hero.y },
    enemies: spec.enemies.map((e): EnemySpec => ({ ...e, x: mirrorX(e.x, w) })),
    pushables: spec.pushables.map((p) => ({ ...p, x: mirrorX(p.x, w) })),
    boxes: spec.boxes.map((b): BoxSpec => ({ ...b, x: mirrorX(b.x, w), ...(b.collapse ? { collapse: mirrorZone(b.collapse, w) } : {}) })),
    springboards: spec.springboards.map((s): SpringboardSpec => ({ ...s, x: mirrorX(s.x, w), dirX: round(0 - s.dirX) })),
    hazards: spec.hazards.map((h): HazardSpec => ({ ...h, zone: mirrorZone(h.zone, w) })),
    objective: spec.objective.type === 'push' ? { ...spec.objective, goal: { ...spec.objective.goal, x: mirrorX(spec.objective.goal.x, w) } } : spec.objective,
  };
}

/** Échange crapaud ↔ gelée (même rayon), en gardant position, rôle et bouclier. */
function swapEnemies(spec: RoomSpec): RoomSpec {
  return { ...spec, enemies: spec.enemies.map((e): EnemySpec => ({ ...e, archetype: SWAPPED[e.archetype] ?? e.archetype })) };
}

function hasSwappable(spec: RoomSpec): boolean {
  return spec.enemies.some((e) => SWAPPED[e.archetype] !== undefined);
}

/** JSON dont les clés sont triées récursivement : insensible à l'ordre d'insertion et à la mise en forme. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return v;
    return Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  });
}

/**
 * Empreinte visuelle d'une salle : identifiant, nom et graine exclus, listes
 * triées et index d'objectif résolu. Deux variantes d'empreinte égale se
 * jouent sur la même disposition (une salle symétrique, son miroir).
 */
function layoutKey(spec: RoomSpec): string {
  const sorted = (items: readonly unknown[]): string[] => items.map((item) => stableStringify(item)).sort();
  return stableStringify({
    width: spec.width,
    height: spec.height,
    wallRestitution: spec.wallRestitution,
    hero: spec.hero,
    healOnEnter: spec.healOnEnter,
    reward: spec.reward,
    contract: spec.contract,
    enemies: sorted(spec.enemies),
    pushables: sorted(spec.pushables),
    boxes: sorted(spec.boxes),
    springboards: sorted(spec.springboards),
    hazards: sorted(spec.hazards),
    objective: spec.objective.type === 'push' ? { goal: spec.objective.goal, object: spec.pushables[spec.objective.object] } : spec.objective,
  });
}

interface Outcome {
  variant: PoolVariant;
  id: string;
  /** Raison du rejet, ou '' si la variante est retenue. */
  reason: string;
  entry?: PoolEntry;
  turns: number | null;
  evaluations: number;
  ms: number;
}

interface Summary {
  source: string;
  name: string;
  outcomes: Outcome[];
}

function evaluate(source: RoomSpec, variant: (typeof VARIANTS)[number], candidate: RoomSpec, tutorial: boolean): Outcome {
  const id = variant.variant === 'base' ? source.id : `${source.id}#${variant.variant}`;
  const t0 = performance.now();
  const outcome: Outcome = { variant: variant.variant, id, reason: '', turns: null, evaluations: 0, ms: 0 };
  const finish = (reason: string): Outcome => {
    outcome.reason = reason;
    outcome.ms = performance.now() - t0;
    return outcome;
  };

  let spec: RoomSpec;
  try {
    spec = validateRoomSpec({ ...candidate, id, seed: source.seed + variant.seedOffset }, id);
  } catch (error) {
    return finish(`invalide : ${error instanceof Error ? error.message : String(error)}`);
  }
  const problems = [...structuralProblems(spec), ...startProblems(spec)];
  if (problems.length > 0) return finish(problems.join(' ; '));

  const result = solveRoom(spec, SOLVER_OPTIONS);
  outcome.turns = result.turns;
  outcome.evaluations = result.evaluations;
  if (!result.solvable || result.turns === null) return finish('non résoluble');
  if (replaySequence(spec, result.sequence, SOLVER_OPTIONS.carry) !== 'won') return finish('la solution ne se rejoue pas en victoire');
  if (isTooEasy(result, tutorial)) return finish(`trop facile (ratio du premier tour ${result.firstTurnWinRatio.toFixed(3)})`);

  const placement = TIERS[source.id];
  if (!placement) return finish(`aucun palier pour ${source.id} dans scripts/build-pool.ts`);
  outcome.entry = { id, source: source.id, variant: variant.variant, tier: placement.tier, kind: placement.kind, turns: result.turns, spec };
  return finish('');
}

function readSources(): RoomSpec[] {
  const files = readdirSync(ROOMS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((file) => validateRoomSpec(JSON.parse(readFileSync(`${ROOMS_DIR}${file}`, 'utf8')), file));
}

/** Génère les variantes d'une salle source : candidats distincts, dans l'ordre fixe de `VARIANTS`. */
function buildRoom(source: RoomSpec): Summary & { duplicates: string[] } {
  const entry = ENTRIES[source.id];
  const tutorial = entry?.tutorial === true;
  const outcomes: Outcome[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  for (const variant of VARIANTS) {
    if (variant.swap && !hasSwappable(source)) continue;
    let candidate = source;
    if (variant.mirror) candidate = mirrorRoom(candidate);
    if (variant.swap) candidate = swapEnemies(candidate);
    const key = layoutKey(candidate);
    if (seen.has(key)) {
      duplicates.push(variant.variant);
      continue;
    }
    seen.add(key);
    outcomes.push(evaluate(source, variant, candidate, tutorial));
  }
  return { source: source.id, name: source.name, outcomes, duplicates };
}

function serialize(file: PoolFile): string {
  const lines = file.entries.map((entry) => `    ${JSON.stringify(entry)}`);
  return `{\n  "version": ${file.version},\n  "entries": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

function pad(value: string | number, width: number, right = false): string {
  const s = String(value);
  return right ? s.padStart(width) : s.padEnd(width);
}

function main(): number {
  const check = process.argv.slice(2).includes('--check');
  const started = performance.now();
  const sources = readSources();

  const known = new Set(sources.map((s) => s.id));
  let failed = false;
  for (const id of Object.keys(TIERS)) {
    if (!known.has(id)) {
      console.error(`PROBLÈME palier défini pour ${id}, mais aucune salle source n'a cet identifiant`);
      failed = true;
    }
  }

  const summaries: Array<Summary & { duplicates: string[] }> = [];
  for (const source of sources) {
    if (!TIERS[source.id]) {
      console.error(`PROBLÈME ${source.id} : aucun palier dans scripts/build-pool.ts`);
      failed = true;
      continue;
    }
    summaries.push(buildRoom(source));
  }

  const entries: PoolEntry[] = summaries.flatMap((s) => s.outcomes.flatMap((o) => (o.entry ? [o.entry] : [])));
  const header = `${pad('salle', 34)}${pad('candidats', 11, true)}${pad('retenus', 9, true)}${pad('durée', 10, true)}  détail`;
  console.log(header);
  console.log('-'.repeat(header.length + 30));
  for (const s of summaries) {
    const kept = s.outcomes.filter((o) => o.entry);
    const ms = s.outcomes.reduce((sum, o) => sum + o.ms, 0);
    const notes = [
      ...s.outcomes.filter((o) => !o.entry).map((o) => `${o.variant} écartée (${o.reason})`),
      ...s.duplicates.map((v) => `${v} omise (même disposition qu'une variante précédente)`),
    ];
    console.log(
      `${pad(`${s.source} ${s.name}`, 34)}${pad(s.outcomes.length, 11, true)}${pad(kept.length, 9, true)}${pad(`${(ms / 1000).toFixed(2)} s`, 10, true)}  ${kept.map((o) => o.variant).join(' ')}${notes.length > 0 ? ` | ${notes.join(' ; ')}` : ''}`,
    );
    if (kept.length === 0) {
      console.error(`PROBLÈME ${s.source} : aucune variante retenue`);
      failed = true;
    }
  }
  const candidates = summaries.reduce((n, s) => n + s.outcomes.length, 0);

  const file: PoolFile = { version: 1, entries };
  if (check) {
    if (!existsSync(POOL_FILE)) {
      console.error(`PROBLÈME ${POOL_FILE} est absent : lancer \`npm run pool\` et le committer`);
      failed = true;
    } else {
      const committed = stableStringify(JSON.parse(readFileSync(POOL_FILE, 'utf8')));
      if (committed !== stableStringify(file)) {
        console.error('PROBLÈME src/data/pool.generated.json est périmé : lancer `npm run pool` et committer le résultat');
        failed = true;
      }
    }
  } else if (!failed) {
    writeFileSync(POOL_FILE, serialize(file));
  }

  const total = (performance.now() - started) / 1000;
  console.log(
    `\n${entries.length} salles retenues sur ${candidates} candidats en ${total.toFixed(1)} s, ${failed ? 'ÉCHEC' : check ? 'le fichier commité est à jour' : 'src/data/pool.generated.json écrit'}.`,
  );
  return failed ? 1 : 0;
}

process.exitCode = main();
