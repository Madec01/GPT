/**
 * Stockage local typé et tolérant : sauvegarde de run et options. Toute
 * donnée corrompue, absente ou d'une autre version est ignorée sans erreur.
 * Le stockage est injecté pour être testable en Node.
 */
import type { HeroCarry } from '../sim/room';
import { parseSettings, type GameSettings } from './options';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RunStats {
  /** Tours joués par salle, par identifiant de nœud. */
  turns: Record<string, number>;
  damageTaken: number;
  roomsCleared: number;
}

export interface SaveGame {
  version: 1;
  /** Nœud où reprendre, au début de sa salle. */
  nodeId: string;
  carry: HeroCarry;
  /** Nœuds traversés, dans l'ordre. */
  path: string[];
  stats: RunStats;
  savedAt: number;
}

export const SAVE_KEY = 'fronde.save';
export const SETTINGS_KEY = 'fronde.settings';

export function emptyStats(): RunStats {
  return { turns: {}, damageTaken: 0, roomsCleared: 0 };
}

function isCarry(value: unknown): value is HeroCarry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['hp'] === 'number' &&
    Number.isInteger(v['hp']) &&
    v['hp'] >= 1 &&
    typeof v['charge'] === 'number' &&
    Number.isInteger(v['charge']) &&
    v['charge'] >= 0 &&
    (v['form'] === 'none' || v['form'] === 'pierre')
  );
}

/** Lit une sauvegarde valide ou renvoie null. `knownNodes` rejette un nœud disparu de la campagne. */
export function parseSave(value: unknown, knownNodes: readonly string[]): SaveGame | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v['version'] !== 1) return null;
  if (typeof v['nodeId'] !== 'string' || !knownNodes.includes(v['nodeId'])) return null;
  if (!isCarry(v['carry'])) return null;
  const path = Array.isArray(v['path']) ? v['path'].filter((p): p is string => typeof p === 'string' && knownNodes.includes(p)) : [];
  const statsRaw = (typeof v['stats'] === 'object' && v['stats'] !== null ? v['stats'] : {}) as Record<string, unknown>;
  const turnsRaw = (typeof statsRaw['turns'] === 'object' && statsRaw['turns'] !== null ? statsRaw['turns'] : {}) as Record<string, unknown>;
  const turns: Record<string, number> = {};
  for (const [k, t] of Object.entries(turnsRaw)) if (typeof t === 'number' && Number.isInteger(t) && t >= 0) turns[k] = t;
  const stats: RunStats = {
    turns,
    damageTaken: typeof statsRaw['damageTaken'] === 'number' ? statsRaw['damageTaken'] : 0,
    roomsCleared: typeof statsRaw['roomsCleared'] === 'number' ? statsRaw['roomsCleared'] : 0,
  };
  return {
    version: 1,
    nodeId: v['nodeId'],
    carry: { hp: v['carry'].hp, charge: v['carry'].charge, form: v['carry'].form },
    path,
    stats,
    savedAt: typeof v['savedAt'] === 'number' ? v['savedAt'] : 0,
  };
}

export class GameStorage {
  constructor(private readonly backend: StorageLike | null) {}

  /** `localStorage` quand il est utilisable, sinon un stockage nul et silencieux. */
  static browser(): GameStorage {
    try {
      const probe = '__fronde_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return new GameStorage(localStorage);
    } catch {
      return new GameStorage(null);
    }
  }

  private read(key: string): unknown {
    try {
      const raw = this.backend?.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      this.backend?.setItem(key, JSON.stringify(value));
    } catch {
      // Stockage plein ou interdit : la partie continue sans sauvegarde.
    }
  }

  loadSave(knownNodes: readonly string[]): SaveGame | null {
    return parseSave(this.read(SAVE_KEY), knownNodes);
  }

  saveGame(save: SaveGame): void {
    this.write(SAVE_KEY, save);
  }

  clearSave(): void {
    try {
      this.backend?.removeItem(SAVE_KEY);
    } catch {
      // Rien à faire.
    }
  }

  loadSettings(): GameSettings {
    return parseSettings(this.read(SETTINGS_KEY));
  }

  saveSettings(settings: GameSettings): void {
    this.write(SETTINGS_KEY, settings);
  }
}
