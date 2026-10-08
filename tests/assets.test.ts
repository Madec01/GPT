import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fous des ressources de `public/assets/` : tout ce que cite le manifeste
 * existe, tout ce qui est présent est crédité, les licences sont autorisées et
 * le budget de taille est respecté.
 */

const ROOT = fileURLToPath(new URL('../public/assets/', import.meta.url));

const ALLOWED_LICENSES = ['CC0 1.0', 'CC BY 3.0', 'CC BY 4.0', 'OFL 1.1'];
const ATTRIBUTION_REQUIRED = ['CC BY 3.0', 'CC BY 4.0'];

const MAX_IMAGE_BYTES = 256 * 1024;
const MAX_IMAGE_SIDE = 512;
const MAX_SOUND_BYTES = 150 * 1024;
const MAX_MUSIC_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

const HERO_EXPRESSIONS = ['neutral', 'aim', 'flight', 'impact', 'happy', 'worried', 'hit'];
const ENEMY_EXPRESSIONS = ['neutral', 'stunned', 'hit'];
const ENEMIES = ['crapaud', 'gelee', 'rocailleux', 'boss'];
const PROP_KEYS = ['floor', 'wall', 'crate', 'barricade', 'column', 'pit', 'spring', 'egg', 'boulder', 'heart', 'goal'];
const UI_KEYS = ['panel', 'button', 'buttonPressed', 'heartFull', 'heartEmpty', 'chargeOn', 'chargeOff', 'iconBrake', 'iconPower'];
const FX_KEYS = ['spark', 'glow', 'smoke', 'star', 'debrisWood', 'debrisStone'];
const AUDIO_KEYS = [
  'throw', 'bounceWall', 'bounceEnemy', 'bumper', 'stick', 'impactHeavy', 'crateBreak', 'barricadeBreak', 'columnBreak',
  'spring', 'fall', 'heal', 'heroHit', 'enemyDeath', 'crapaudBurst', 'stun', 'uiTap', 'win', 'lose', 'chargeUp',
  'strongThrow', 'note',
];
const MUSIC_KEYS = ['explore', 'wilds', 'boss'];

interface SpriteEntry {
  file: string;
  pixelsPerUnit: number;
}
interface Offset {
  x: number;
  y: number;
}
interface CharacterEntry {
  body: string | null;
  eyes: Record<string, string | null>;
  mouth: Record<string, string | null>;
  eyesOffset: Offset;
  mouthOffset: Offset;
}
interface CreditEntry {
  files: string[];
  title: string;
  author: string;
  license: string;
  url: string;
  attribution: string;
}
interface Manifest {
  version: number;
  sprites: Record<string, SpriteEntry>;
  characters: Record<string, CharacterEntry | null>;
  props: Record<string, string | null>;
  ui: Record<string, string | null>;
  fx: Record<string, string | null>;
  audio: Record<string, { file: string; volume: number }>;
  music: Record<string, string>;
  fonts: Record<string, { family: string; file: string }>;
  credits: CreditEntry[];
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8')) as Manifest;

/** Tous les fichiers de `public/assets/`, en chemins relatifs avec des barres obliques. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(relative(ROOT, full).split('\\').join('/'));
  }
  return out;
}

const allFiles = listFiles(ROOT);
const sizeOf = (rel: string): number => statSync(join(ROOT, rel)).size;
const isLicenseNotice = (rel: string): boolean => basename(rel) === 'OFL.txt';

/** Dimensions lues dans l'en-tête IHDR d'un PNG. */
function pngSize(rel: string): { width: number; height: number } {
  const buf = readFileSync(join(ROOT, rel));
  expect(buf.subarray(1, 4).toString('latin1'), `${rel} n'est pas un PNG`).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Chaque chemin cité par le manifeste, avec l'endroit où il est cité. */
function referencedFiles(): { where: string; file: string }[] {
  const refs: { where: string; file: string }[] = [];
  for (const [key, s] of Object.entries(manifest.sprites)) refs.push({ where: `sprites.${key}`, file: s.file });
  for (const [key, a] of Object.entries(manifest.audio)) refs.push({ where: `audio.${key}`, file: a.file });
  for (const [key, f] of Object.entries(manifest.music)) refs.push({ where: `music.${key}`, file: f });
  for (const [key, f] of Object.entries(manifest.fonts)) refs.push({ where: `fonts.${key}`, file: f.file });
  manifest.credits.forEach((c, i) => c.files.forEach((f) => refs.push({ where: `credits[${i}]`, file: f })));
  return refs;
}

describe('manifeste des ressources', () => {
  it('a la version 1 et les groupes attendus', () => {
    expect(manifest.version).toBe(1);
    for (const group of ['sprites', 'characters', 'props', 'ui', 'fx', 'audio', 'music', 'fonts', 'credits']) {
      expect(manifest, `groupe ${group}`).toHaveProperty(group);
    }
  });

  it('cite uniquement des fichiers qui existent', () => {
    for (const { where, file } of referencedFiles()) {
      expect(existsSync(join(ROOT, file)), `${where} : ${file} est introuvable`).toBe(true);
    }
  });

  it('range les fichiers dans les dossiers prévus, en minuscules sans espaces', () => {
    const folders = ['sprites', 'props', 'props-alt', 'ui', 'fx', 'audio', 'music', 'fonts'];
    for (const rel of allFiles) {
      if (rel === 'manifest.json') continue;
      const folder = rel.split('/')[0] ?? '';
      expect(folders, `${rel} : dossier inattendu`).toContain(folder);
      if (!isLicenseNotice(rel)) expect(rel, `${rel} : nom en minuscules sans espaces`).toMatch(/^[a-z0-9._/-]+$/);
    }
  });

  it('ne contient aucun Ogg Vorbis (illisible sur Safari iOS)', () => {
    for (const rel of allFiles) expect(['.ogg', '.oga'], rel).not.toContain(extname(rel).toLowerCase());
  });
});

describe('sprites', () => {
  it('ont une échelle valide et un fichier PNG', () => {
    for (const [key, s] of Object.entries(manifest.sprites)) {
      expect(s.pixelsPerUnit, `${key} : pixelsPerUnit`).toBeGreaterThan(0);
      expect(extname(s.file), `${key} : extension`).toBe('.png');
    }
  });

  it('chaque clé de sprite citée par un groupe existe, ou vaut null explicitement', () => {
    const groups: [string, Record<string, string | null>][] = [
      ['props', manifest.props],
      ['ui', manifest.ui],
      ['fx', manifest.fx],
    ];
    for (const [name, group] of groups) {
      for (const [key, ref] of Object.entries(group)) {
        if (ref !== null) expect(manifest.sprites, `${name}.${key} -> ${ref}`).toHaveProperty(ref);
      }
    }
    for (const [name, c] of Object.entries(manifest.characters)) {
      if (c === null) continue;
      const refs = [c.body, ...Object.values(c.eyes), ...Object.values(c.mouth)];
      for (const ref of refs) {
        if (ref !== null) expect(manifest.sprites, `characters.${name} -> ${ref}`).toHaveProperty(ref);
      }
    }
  });

  it('couvrent tous les accessoires, éléments d\'interface et effets du contrat', () => {
    for (const k of PROP_KEYS) expect(manifest.props, `props.${k}`).toHaveProperty(k);
    for (const k of UI_KEYS) expect(manifest.ui, `ui.${k}`).toHaveProperty(k);
    for (const k of FX_KEYS) expect(manifest.fx, `fx.${k}`).toHaveProperty(k);
  });

  it('chaque personnage a toutes ses expressions ou un null explicite', () => {
    const expected: [string, string[]][] = [['hero', HERO_EXPRESSIONS], ...ENEMIES.map((e): [string, string[]] => [e, ENEMY_EXPRESSIONS])];
    for (const [name, expressions] of expected) {
      expect(manifest.characters, `personnage ${name}`).toHaveProperty(name);
      const c = manifest.characters[name];
      if (c === null || c === undefined) continue; // null explicite : le code dessine un substitut
      expect(c, `${name}.body`).toHaveProperty('body');
      for (const e of expressions) {
        expect(c.eyes, `${name}.eyes.${e}`).toHaveProperty(e);
        expect(c.mouth, `${name}.mouth.${e}`).toHaveProperty(e);
      }
      for (const off of [c.eyesOffset, c.mouthOffset]) {
        expect(Number.isFinite(off.x) && Number.isFinite(off.y), `${name} : décalage non numérique`).toBe(true);
      }
    }
  });

  it('respectent le budget : 256 Ko et 512 px de côté au plus', () => {
    for (const [key, s] of Object.entries(manifest.sprites)) {
      expect(sizeOf(s.file), `${key} (${s.file}) : poids`).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
      const { width, height } = pngSize(s.file);
      expect(Math.max(width, height), `${key} (${s.file}) : côté`).toBeLessThanOrEqual(MAX_IMAGE_SIDE);
    }
    for (const rel of allFiles.filter((f) => extname(f) === '.png')) {
      expect(sizeOf(rel), `${rel} : poids`).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
      const { width, height } = pngSize(rel);
      expect(Math.max(width, height), `${rel} : côté`).toBeLessThanOrEqual(MAX_IMAGE_SIDE);
    }
  });
});

describe('sons et musiques', () => {
  it('couvrent toutes les clés audio du contrat, en MP3 ou M4A, avec un volume entre 0 et 1', () => {
    for (const k of AUDIO_KEYS) {
      expect(manifest.audio, `audio.${k}`).toHaveProperty(k);
      const a = manifest.audio[k];
      if (a === undefined) continue;
      expect(['.mp3', '.m4a'], `${k} : format`).toContain(extname(a.file));
      expect(a.volume, `${k} : volume`).toBeGreaterThan(0);
      expect(a.volume, `${k} : volume`).toBeLessThanOrEqual(1);
    }
  });

  it('chaque son pèse 150 Ko au plus', () => {
    for (const [key, a] of Object.entries(manifest.audio)) {
      expect(sizeOf(a.file), `${key} (${a.file})`).toBeLessThanOrEqual(MAX_SOUND_BYTES);
    }
  });

  it('chaque musique pèse 5 Mo au plus et le thème, l\'exploration et le boss existent', () => {
    for (const k of MUSIC_KEYS) {
      expect(manifest.music, `music.${k}`).toHaveProperty(k);
      const file = manifest.music[k];
      if (file === undefined) continue;
      expect(['.mp3', '.m4a'], `${k} : format`).toContain(extname(file));
      expect(sizeOf(file), `${k} (${file})`).toBeLessThanOrEqual(MAX_MUSIC_BYTES);
    }
  });
});

describe('polices', () => {
  it('déclarent un titre et un texte, avec leur OFL.txt à côté', () => {
    for (const k of ['title', 'text']) {
      expect(manifest.fonts, `fonts.${k}`).toHaveProperty(k);
      const f = manifest.fonts[k];
      if (f === undefined) continue;
      expect(f.family.length, `fonts.${k}.family`).toBeGreaterThan(0);
      expect(extname(f.file), `fonts.${k} : format`).toBe('.ttf');
      const dir = f.file.split('/').slice(0, -1).join('/');
      expect(existsSync(join(ROOT, dir, 'OFL.txt')), `fonts.${k} : OFL.txt manquant dans ${dir}`).toBe(true);
    }
  });
});

describe('crédits et licences', () => {
  it('chaque fichier présent (hors manifest.json et OFL.txt) est cité dans un bloc de crédits', () => {
    const cited = new Set(manifest.credits.flatMap((c) => c.files));
    for (const rel of allFiles) {
      if (rel === 'manifest.json' || isLicenseNotice(rel)) continue;
      expect(cited.has(rel), `${rel} : absent des crédits`).toBe(true);
    }
  });

  it('chaque bloc de crédits est complet et sous une licence autorisée', () => {
    expect(manifest.credits.length).toBeGreaterThan(0);
    manifest.credits.forEach((c, i) => {
      const id = `credits[${i}] ${c.title}`;
      expect(c.title.length, `${id} : titre`).toBeGreaterThan(0);
      expect(c.author.length, `${id} : auteur`).toBeGreaterThan(0);
      expect(c.url, `${id} : lien`).toMatch(/^https:\/\//);
      expect(c.files.length, `${id} : fichiers`).toBeGreaterThan(0);
      expect(ALLOWED_LICENSES, `${id} : licence "${c.license}" non autorisée`).toContain(c.license);
      if (ATTRIBUTION_REQUIRED.includes(c.license)) {
        expect(c.attribution.length, `${id} : attribution obligatoire pour ${c.license}`).toBeGreaterThan(0);
      }
    });
  });

  it('rappelle l\'attribution exacte de Scott Buckley et de game-icons.net', () => {
    const byTitle = (t: string): CreditEntry | undefined => manifest.credits.find((c) => c.title === t);
    expect(byTitle('Three Sheets To The Wind')?.attribution).toBe(
      "'Three Sheets To The Wind' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au",
    );
    expect(byTitle('Into The Wilds')?.attribution).toBe("'Into The Wilds' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au");
    expect(byTitle('Juggernaut')?.attribution).toBe("'Juggernaut' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au");
    for (const c of manifest.credits.filter((x) => x.url.startsWith('https://game-icons.net/'))) {
      expect(c.attribution).toMatch(/^Icons made by .+\. Available on https:\/\/game-icons\.net$/);
    }
  });
});

describe('budget de taille global', () => {
  it('public/assets/ pèse 25 Mo au plus', () => {
    const total = allFiles.reduce((sum, rel) => sum + sizeOf(rel), 0);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });
});
