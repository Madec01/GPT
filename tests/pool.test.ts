import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { POOL, roomsForTier, type PoolEntry } from '../src/data/pool';
import { ROOMS } from '../src/data/rooms';
import { validateRoomSpec } from '../src/data/schema';

const POOL_FILE = fileURLToPath(new URL('../src/data/pool.generated.json', import.meta.url));

function mirrored(entry: PoolEntry): boolean {
  return entry.variant === 'm' || entry.variant === 'ms1';
}

function source(entry: PoolEntry) {
  const room = ROOMS[entry.source];
  if (!room) throw new Error(`salle source inconnue : ${entry.source}`);
  return room;
}

describe('vivier de salles', () => {
  it('le fichier généré est présent, versionné et non vide', () => {
    expect(existsSync(POOL_FILE)).toBe(true);
    const raw = JSON.parse(readFileSync(POOL_FILE, 'utf8')) as { version: unknown; entries: unknown[] };
    expect(raw.version).toBe(1);
    expect(raw.entries.length).toBeGreaterThan(0);
    expect(POOL).toHaveLength(raw.entries.length);
  });

  it('chaque entrée se valide, sous son propre identifiant', () => {
    const raw = JSON.parse(readFileSync(POOL_FILE, 'utf8')) as { entries: Array<{ id: string; spec: unknown }> };
    for (const entry of raw.entries) {
      const spec = validateRoomSpec(entry.spec, entry.id);
      expect(spec.id).toBe(entry.id);
    }
    for (const entry of POOL) {
      expect(entry.spec.id).toBe(entry.id);
      expect(entry.turns).toBeGreaterThanOrEqual(1);
    }
  });

  it('les identifiants et les graines sont uniques', () => {
    expect(new Set(POOL.map((e) => e.id)).size).toBe(POOL.length);
    expect(new Set(POOL.map((e) => e.spec.seed)).size).toBe(POOL.length);
  });

  it('chaque salle source a au moins une entrée, et les identifiants suivent la convention', () => {
    for (const id of Object.keys(ROOMS)) {
      expect(POOL.some((e) => e.source === id), `aucune entrée pour ${id}`).toBe(true);
    }
    for (const entry of POOL) {
      expect(ROOMS[entry.source], `source inconnue ${entry.source}`).toBeDefined();
      expect(entry.id).toBe(entry.variant === 'base' ? entry.source : `${entry.source}#${entry.variant}`);
      expect(entry.spec.name).toBe(source(entry).name);
    }
  });

  it('conserve les contrats, récompenses et soins des salles sources', () => {
    for (const entry of POOL) {
      const room = source(entry);
      expect(entry.spec.contract).toEqual(room.contract);
      expect(entry.spec.reward).toBe(room.reward);
      expect(entry.spec.healOnEnter).toBe(room.healOnEnter);
    }
  });

  it('contient au moins une salle miroir', () => {
    expect(POOL.some(mirrored)).toBe(true);
  });

  it('un miroir conserve les distances au mur du héros et des corps', () => {
    for (const entry of POOL.filter(mirrored)) {
      const room = source(entry);
      const { spec } = entry;
      expect(spec.width).toBe(room.width);
      expect(spec.hero.x + room.hero.x).toBeCloseTo(room.width, 6);
      expect(spec.hero.y).toBe(room.hero.y);
      expect(spec.enemies).toHaveLength(room.enemies.length);
      spec.enemies.forEach((e, i) => {
        expect(e.x + room.enemies[i]!.x).toBeCloseTo(room.width, 6);
        expect(e.y).toBe(room.enemies[i]!.y);
      });
      spec.boxes.forEach((b, i) => expect(b.x + room.boxes[i]!.x).toBeCloseTo(room.width, 6));
      spec.pushables.forEach((p, i) => expect(p.x + room.pushables[i]!.x).toBeCloseTo(room.width, 6));
    }
  });

  it('un échange ne touche que le type des crapauds et des gelées', () => {
    const swaps = POOL.filter((e) => e.variant === 's1' || e.variant === 'ms1');
    expect(swaps.length).toBeGreaterThan(0);
    for (const entry of swaps) {
      const room = source(entry);
      entry.spec.enemies.forEach((e, i) => {
        const origin = room.enemies[i]!;
        const expected = origin.archetype === 'crapaud' ? 'gelee' : origin.archetype === 'gelee' ? 'crapaud' : origin.archetype;
        expect(e.archetype).toBe(expected);
        expect(e.role).toBe(origin.role);
        expect(e.shield).toBe(origin.shield);
      });
    }
  });

  it('range les salles par palier et par genre', () => {
    expect(roomsForTier(1, 'combat').length).toBeGreaterThan(0);
    expect(roomsForTier(1, 'boss').length).toBeGreaterThan(0);
    expect(roomsForTier(2, 'boss').length).toBeGreaterThan(0);
    for (const entry of roomsForTier(1, 'combat')) {
      expect(entry.tier).toBe(1);
      expect(entry.kind).toBe('combat');
    }
    const bossSources = new Set(POOL.filter((e) => e.kind === 'boss').map((e) => e.source));
    expect([...bossSources].sort()).toEqual(['salle-6', 'terrasse-6']);
    // Un tableau neuf à chaque appel : le vivier ne se modifie pas par ricochet.
    expect(roomsForTier(1, 'combat')).not.toBe(roomsForTier(1, 'combat'));
  });
});
