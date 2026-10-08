import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, nextVolume, parseSettings, volumeLabel } from '../src/app/options';
import { creditsScreen, optionsScreen, pauseScreen, titleScreen } from '../src/app/screens';
import { GameStorage, parseSave, SAVE_KEY, type StorageLike } from '../src/app/storage';
import { moveTo, newRun, reachable } from '../src/run/state';

class MemoryStorage implements StorageLike {
  readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('options', () => {
  it('tourne entre quatre paliers et revient au début', () => {
    expect(nextVolume(1)).toBe(0);
    expect(nextVolume(0)).toBeCloseTo(0.35);
    expect(nextVolume(0.33)).toBeCloseTo(0.7);
    expect(nextVolume(0.5)).toBe(1);
    expect(volumeLabel(0)).toBe('muet');
    expect(volumeLabel(1)).toBe('fort');
  });

  it('répare des options corrompues champ par champ', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    const parsed = parseSettings({ volumes: { master: 7, sfx: 'x' }, brakeSide: 'right', test: { enabled: true, invincible: 'oui' } });
    expect(parsed.volumes).toEqual({ master: 1, sfx: 0.9, music: 0.6 });
    expect(parsed.brakeSide).toBe('right');
    expect(parsed.test).toEqual({ enabled: true, invincible: false, fullPath: false });
  });
});

describe('sauvegarde', () => {
  it('accepte une sauvegarde de run valide et refuse les autres', () => {
    const run = newRun(21);
    moveTo(run, reachable(run)[0]!.id);
    const save = { version: 2, run, savedAt: 5 };
    expect(parseSave(save)).toEqual({ version: 2, run, savedAt: 5 });
    expect(parseSave({ ...save, version: 1 })).toBeNull();
    expect(parseSave({ ...save, run: { ...run, hp: 99 } })).toBeNull();
    expect(parseSave({ ...save, run: { ...run, phase: 'dead' } })).toBeNull();
    expect(parseSave('n\'importe quoi')).toBeNull();
  });

  it('écrit, relit et efface via un stockage injecté, et survit à un JSON cassé', () => {
    const backend = new MemoryStorage();
    const storage = new GameStorage(backend);
    expect(storage.loadSave()).toBeNull();
    const run = newRun(22);
    storage.saveGame({ version: 2, run, savedAt: 1 });
    expect(storage.loadSave()?.run.seed).toBe(22);
    backend.setItem(SAVE_KEY, '{cassé');
    expect(storage.loadSave()).toBeNull();
    storage.clearSave();
    expect(backend.getItem(SAVE_KEY)).toBeNull();
  });
});

describe('écrans', () => {
  it('l\'accueil propose la reprise seulement s\'il y a une sauvegarde', () => {
    expect(titleScreen(false, '0.6.0').buttons.map((b) => b.id)).toEqual(['new-run', 'options', 'credits']);
    expect(titleScreen(true, '0.6.0').buttons[0]!.id).toBe('continue-run');
    expect(titleScreen(true, '0.6.0').lines[1]).toContain('0.6.0');
  });

  it('les options reviennent vers l\'écran d\'origine et listent les salles du mode test', () => {
    const fromTitle = optionsScreen(DEFAULT_SETTINGS, ['La Cour basse', 'Le Chemin de ronde'], 1, 'title');
    expect(fromTitle.buttons.at(-1)!.id).toBe('back-title');
    expect(optionsScreen(DEFAULT_SETTINGS, ['La Cour basse'], 0, 'pause').buttons.at(-1)!.id).toBe('back-pause');
  });

  it('pagine les crédits', () => {
    const credits = Array.from({ length: 9 }, (_, i) => ({ files: [], title: `T${i}`, author: 'A', license: 'CC0 1.0', url: '' }));
    expect(creditsScreen(credits, 0).title).toBe('Crédits 1/3');
    expect(creditsScreen(credits, 2).lines).toHaveLength(1);
    expect(creditsScreen(credits, 2).buttons[0]!.label).toBe('Première page');
    expect(creditsScreen([], 0).lines[0]).toContain('Aucune');
  });

  it('la pause propose la carte du run, les charmes et l\'abandon', () => {
    expect(pauseScreen('La Cour basse').buttons.map((b) => b.id)).toEqual(['resume', 'map-pause', 'charms-pause', 'options-pause', 'quit', 'restart']);
  });
});
