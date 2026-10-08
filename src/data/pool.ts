/**
 * Vivier de salles du mode roguelite : les quatorze salles de `rooms/` et leurs
 * variantes (miroir horizontal, échange crapaud ↔ gelée), toutes résolues par
 * le solveur à la génération.
 *
 * Le fichier `pool.generated.json` est produit par `npm run pool`
 * (`scripts/build-pool.ts`) ; ne pas l'éditer à la main. Ce module ne dépend
 * pas du solveur : il relit le JSON et valide chaque salle au chargement, comme
 * `rooms/index.ts`, pour qu'un fichier mal formé échoue au démarrage.
 */
import type { RoomSpec } from '../sim/room';
import { validateRoomSpec } from './schema';
import poolJson from './pool.generated.json';

/** Palier de difficulté : 1 pour l'avant-poste, 2 et 3 pour les Terrasses. */
export type PoolTier = 1 | 2 | 3;
export type PoolKind = 'combat' | 'boss';
/**
 * `base` : la salle source telle quelle ; `m` : miroir horizontal ;
 * `s1` : crapauds et gelées échangés ; `ms1` : miroir puis échange.
 */
export type PoolVariant = 'base' | 'm' | 's1' | 'ms1';

export interface PoolEntry {
  /** Identifiant de la variante, aussi celui de `spec` : `salle-1` pour la base, sinon `salle-1#m`, `#s1`, `#ms1`. */
  id: string;
  /** Identifiant de la salle source. */
  source: string;
  variant: PoolVariant;
  tier: PoolTier;
  kind: PoolKind;
  /** Nombre de tours de la solution trouvée par le solveur, sans pouvoir à l'entrée. */
  turns: number;
  spec: RoomSpec;
}

/** Forme du fichier généré, avant validation. */
export interface PoolFile {
  version: 1;
  entries: PoolEntry[];
}

const VARIANTS: readonly PoolVariant[] = ['base', 'm', 's1', 'ms1'];

function fail(path: string, message: string): never {
  throw new Error(`pool.generated.json ${path} : ${message}`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown, index: number): PoolEntry {
  const path = `entries[${index}]`;
  if (!isObject(value)) return fail(path, 'objet attendu');
  const { id, source, variant, tier, kind, turns } = value;
  if (typeof id !== 'string' || id.length === 0) return fail(`${path}.id`, 'chaîne non vide attendue');
  if (typeof source !== 'string' || source.length === 0) return fail(`${path}.source`, 'chaîne non vide attendue');
  if (typeof variant !== 'string' || !(VARIANTS as readonly string[]).includes(variant)) return fail(`${path}.variant`, `valeur attendue parmi ${VARIANTS.join(', ')}`);
  if (tier !== 1 && tier !== 2 && tier !== 3) return fail(`${path}.tier`, '1, 2 ou 3 attendu');
  if (kind !== 'combat' && kind !== 'boss') return fail(`${path}.kind`, 'combat ou boss attendu');
  if (typeof turns !== 'number' || !Number.isInteger(turns) || turns < 1) return fail(`${path}.turns`, 'entier strictement positif attendu');
  const spec = validateRoomSpec(value['spec'], `${path}.spec`);
  if (spec.id !== id) return fail(`${path}.spec.id`, `doit valoir ${id}, trouvé ${spec.id}`);
  return { id, source, variant: variant as PoolVariant, tier, kind, turns, spec };
}

function loadPool(raw: unknown): readonly PoolEntry[] {
  if (!isObject(raw)) return fail('', 'objet attendu');
  if (raw['version'] !== 1) return fail('.version', `version 1 attendue, trouvée ${String(raw['version'])}`);
  const list = raw['entries'];
  if (!Array.isArray(list)) return fail('.entries', 'tableau attendu');
  const entries = list.map((entry, index) => parseEntry(entry, index));
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) fail('.entries', `identifiant en double : ${entry.id}`);
    ids.add(entry.id);
  }
  return Object.freeze(entries);
}

const rawPool: unknown = poolJson;

/** Toutes les salles du vivier, dans l'ordre du fichier généré. */
export const POOL: readonly PoolEntry[] = loadPool(rawPool);

/** Les salles du vivier d'un palier et d'un genre, dans l'ordre du fichier. Un nouveau tableau à chaque appel. */
export function roomsForTier(tier: PoolTier, kind: PoolKind): PoolEntry[] {
  return POOL.filter((entry) => entry.tier === tier && entry.kind === kind);
}
