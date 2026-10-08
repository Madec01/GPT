/**
 * Options du joueur : volumes, main dominante, mode test. Données simples,
 * valeurs par défaut, et fonctions pures de cycle pour des boutons tactiles
 * sans curseur.
 */
export interface TestOptions {
  enabled: boolean;
  invincible: boolean;
  /** Affiche tout le trajet prédit, pas seulement le premier segment. */
  fullPath: boolean;
}

export interface GameSettings {
  version: 1;
  volumes: { master: number; sfx: number; music: number };
  brakeSide: 'left' | 'right';
  test: TestOptions;
}

export const DEFAULT_SETTINGS: GameSettings = {
  version: 1,
  volumes: { master: 1, sfx: 0.9, music: 0.6 },
  brakeSide: 'left',
  test: { enabled: false, invincible: false, fullPath: false },
};

/** Paliers de volume proposés par un bouton qui tourne : muet, bas, moyen, fort. */
export const VOLUME_STEPS = [0, 0.35, 0.7, 1] as const;

export function nextVolume(current: number): number {
  const index = VOLUME_STEPS.findIndex((v) => Math.abs(v - current) < 0.08);
  if (index === -1) return 1;
  return VOLUME_STEPS[(index + 1) % VOLUME_STEPS.length]!;
}

export function volumeLabel(value: number): string {
  if (value <= 0) return 'muet';
  if (value < 0.5) return 'bas';
  if (value < 0.9) return 'moyen';
  return 'fort';
}

/** Lit des options depuis une valeur inconnue : chaque champ invalide reprend sa valeur par défaut. */
export function parseSettings(value: unknown): GameSettings {
  const d = DEFAULT_SETTINGS;
  if (typeof value !== 'object' || value === null) return structuredClone(d);
  const v = value as Record<string, unknown>;
  const vol = (typeof v['volumes'] === 'object' && v['volumes'] !== null ? v['volumes'] : {}) as Record<string, unknown>;
  const test = (typeof v['test'] === 'object' && v['test'] !== null ? v['test'] : {}) as Record<string, unknown>;
  const num = (x: unknown, fallback: number): number => (typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : fallback);
  const bool = (x: unknown, fallback: boolean): boolean => (typeof x === 'boolean' ? x : fallback);
  return {
    version: 1,
    volumes: { master: num(vol['master'], d.volumes.master), sfx: num(vol['sfx'], d.volumes.sfx), music: num(vol['music'], d.volumes.music) },
    brakeSide: v['brakeSide'] === 'right' ? 'right' : 'left',
    test: { enabled: bool(test['enabled'], false), invincible: bool(test['invincible'], false), fullPath: bool(test['fullPath'], false) },
  };
}
