/**
 * Stockage local typé et tolérant : sauvegarde du run roguelite et options. Toute
 * donnée corrompue, absente ou d'une autre version est ignorée sans erreur.
 * Le stockage est injecté pour être testable en Node.
 */
import { parseRunState, type RunState } from '../run/state';
import { parseSettings, type GameSettings } from './options';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveGame {
  version: 2;
  run: RunState;
  savedAt: number;
}

export const SAVE_KEY = 'fronde.save';
export const SETTINGS_KEY = 'fronde.settings';

/** Lit une sauvegarde valide ou renvoie null : version, puis état de run relu avec tolérance. */
export function parseSave(value: unknown): SaveGame | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v['version'] !== 2) return null;
  const run = parseRunState(v['run']);
  if (!run || run.phase === 'dead' || run.phase === 'won') return null;
  return { version: 2, run, savedAt: typeof v['savedAt'] === 'number' ? v['savedAt'] : 0 };
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

  loadSave(): SaveGame | null {
    return parseSave(this.read(SAVE_KEY));
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
