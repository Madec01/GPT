import { describe, expect, it } from 'vitest';
import { CAMPAIGN } from '../src/data/campaign';
import { DEFAULT_SETTINGS, nextVolume, parseSettings, volumeLabel } from '../src/app/options';
import { campaignOrder, creditsScreen, endingScreen, mapScreen, optionsScreen, titleScreen } from '../src/app/screens';
import { emptyStats, GameStorage, parseSave, SAVE_KEY, type StorageLike } from '../src/app/storage';

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
  const nodes = Object.keys(CAMPAIGN.nodes);

  it('accepte une sauvegarde valide et refuse les autres', () => {
    const save = { version: 1, nodeId: 'salle-3', carry: { hp: 2, charge: 1, form: 'none', element: 'none' }, path: ['salle-1', 'salle-2'], stats: emptyStats(), savedAt: 5 };
    expect(parseSave(save, nodes)).toMatchObject({ nodeId: 'salle-3', carry: { hp: 2, charge: 1, form: 'none', element: 'none' }, path: ['salle-1', 'salle-2'] });
    expect(parseSave({ ...save, nodeId: 'salle-99' }, nodes)).toBeNull();
    expect(parseSave({ ...save, version: 2 }, nodes)).toBeNull();
    expect(parseSave({ ...save, carry: { hp: 0, charge: 0, form: 'none', element: 'none' } }, nodes)).toBeNull();
    expect(parseSave('n\'importe quoi', nodes)).toBeNull();
  });

  it('écrit, relit et efface via un stockage injecté, et survit à un JSON cassé', () => {
    const backend = new MemoryStorage();
    const storage = new GameStorage(backend);
    expect(storage.loadSave(nodes)).toBeNull();
    storage.saveGame({ version: 1, nodeId: 'salle-2', carry: { hp: 3, charge: 0, form: 'none', element: 'none' }, path: ['salle-1'], stats: emptyStats(), savedAt: 1 });
    expect(storage.loadSave(nodes)?.nodeId).toBe('salle-2');
    backend.setItem(SAVE_KEY, '{cassé');
    expect(storage.loadSave(nodes)).toBeNull();
    storage.clearSave();
    expect(backend.getItem(SAVE_KEY)).toBeNull();
    expect(new GameStorage(null).loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('écrans', () => {
  it('propose la reprise seulement avec une sauvegarde', () => {
    expect(titleScreen(false, '0.4.0').buttons.map((b) => b.id)).toEqual(['new-run', 'options', 'credits']);
    expect(titleScreen(true, '0.4.0').buttons[0]!.id).toBe('continue-run');
  });

  it('déplie les réglages de test quand le mode est activé', () => {
    const off = optionsScreen(DEFAULT_SETTINGS, ['A'], 0, 'title');
    expect(off.buttons.some((b) => b.id === 'opt-invincible')).toBe(false);
    const on = optionsScreen({ ...DEFAULT_SETTINGS, test: { enabled: true, invincible: true, fullPath: false } }, ['A', 'B'], 1, 'pause');
    expect(on.buttons.map((b) => b.id)).toContain('opt-node');
    expect(on.buttons.find((b) => b.id === 'opt-node')!.label).toContain('B');
    expect(on.buttons[on.buttons.length - 1]!.id).toBe('back-pause');
  });

  it('pagine les crédits', () => {
    const credits = Array.from({ length: 9 }, (_, i) => ({ files: [], title: `T${i}`, author: 'A', license: 'CC0 1.0', url: '' }));
    expect(creditsScreen(credits, 0).title).toBe('Crédits 1/3');
    expect(creditsScreen(credits, 2).lines).toHaveLength(1);
    expect(creditsScreen(credits, 2).buttons[0]!.label).toBe('Première page');
    expect(creditsScreen([], 0).lines[0]).toContain('Aucune');
  });

  it('ordonne la campagne avec l\'embranchement sur une ligne et fléche le nœud courant', () => {
    const rows = campaignOrder(CAMPAIGN).map((row) => row.map((n) => n.id));
    expect(rows).toEqual([
      ['salle-1'], ['salle-2'], ['salle-3'], ['salle-4a', 'salle-4b'], ['salle-5'], ['salle-6'],
      ['terrasse-1'], ['terrasse-2'], ['terrasse-3'], ['terrasse-4a', 'terrasse-4b'], ['terrasse-5'], ['terrasse-6'],
    ]);
    const map = mapScreen(CAMPAIGN, 'salle-3', ['salle-1', 'salle-2'], ['salle-4a', 'salle-4b']);
    // Une ligne d'en-tête par avant-poste précède ses salles.
    expect(map.lines[0]).toBe('LA PORTE DE GOULAFRE');
    expect(map.lines[3]).toMatch(/^➤ /);
    expect(map.lines[4]).toContain('ou');
    expect(map.lines[7]).toBe('LES TERRASSES');
    expect(map.lines).toHaveLength(14);
    expect(map.buttons.map((b) => b.id)).toEqual(['go:salle-4a', 'go:salle-4b']);
    expect(mapScreen(CAMPAIGN, 'salle-6', [], []).buttons[0]!.id).toBe('restart');
  });

  it('choisit l\'épilogue selon les dégâts subis', () => {
    expect(endingScreen({ turns: { a: 2, b: 3 }, damageTaken: 0, roomsCleared: 2 }).title).toContain('égratignure');
    expect(endingScreen({ turns: {}, damageTaken: 2, roomsCleared: 6 }).lines[1]).toContain('2 dégâts subis');
  });
});
