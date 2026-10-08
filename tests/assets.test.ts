import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fous des ressources de `public/assets/` (manifeste version 2) : tout ce que cite le manifeste
 * existe, tout ce qui est présent est cité et crédité, les licences sont autorisées et le budget de
 * taille est respecté.
 */

const ROOT = fileURLToPath(new URL('../public/assets/', import.meta.url));

const ALLOWED_LICENSES = ['CC0 1.0', 'CC BY 3.0', 'CC BY 4.0', 'OFL 1.1'];
const ATTRIBUTION_REQUIRED = ['CC BY 3.0', 'CC BY 4.0'];

const MAX_IMAGE_BYTES = 256 * 1024;
const MAX_IMAGE_SIDE = 512;
const MAX_SOUND_BYTES = 150 * 1024;
const MAX_MUSIC_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

const CHARACTERS = ['hero', 'crapaud', 'gelee', 'rocailleux', 'boss', 'egg', 'boulder', 'chauve-souris', 'herisson'];
const CHARACTERS_WITH_ELITE = ['crapaud', 'gelee', 'rocailleux', 'boss'];
const EMOTE_KEYS = ['aim', 'flight', 'impact', 'happy', 'worried', 'hit', 'stunned'];
const ACTS = ['1', '2', '3'];
const PROP_KEYS = [
  'crate', 'barricade', 'column', 'columnCracked', 'pit', 'spring', 'ressort', 'explosive', 'heart', 'goal', 'shadow', 'torch',
];
const NODE_KEYS = ['nodeCombat', 'nodeElite', 'nodeEvent', 'nodeShop', 'nodeRest', 'nodeTreasure', 'nodeBoss'];
const UI_KEYS = [
  'panel', 'button', 'buttonPressed', 'heartFull', 'heartEmpty', 'chargeOn', 'chargeOff', 'iconBrake', 'iconPower', 'plume',
  ...NODE_KEYS,
];
const CHARM_KEYS = [
  'bille-de-verre', 'plume-de-plomb', 'grelot', 'corde-double', 'ricochet-d-or', 'oeuf-de-secours', 'mors-de-fer',
  'bouclier-de-plumes', 'aimant-a-plumes', 'pierre-a-aiguiser', 'tambour-de-guerre', 'lanterne',
];
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
  pixelArt?: boolean;
}
interface CharacterEntry {
  sprite: string;
  elite?: string;
  scale: number;
  anchorY: number;
}
interface TileEntry {
  floor: string;
  wall: string;
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
  characters: Record<string, CharacterEntry>;
  emotes: Record<string, string>;
  tiles: Record<string, TileEntry>;
  props: Record<string, string>;
  ui: Record<string, string>;
  charms: Record<string, string>;
  fx: Record<string, string>;
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

/** Vrai si le PNG porte de la transparence : canal alpha (types 4 et 6) ou palette avec bloc tRNS. */
function pngHasAlpha(rel: string): boolean {
  const buf = readFileSync(join(ROOT, rel));
  const colorType = buf[25];
  if (colorType === 4 || colorType === 6) return true;
  return colorType === 3 && buf.includes(Buffer.from('tRNS', 'latin1'));
}

/** Les clés de sprite citées par les groupes du manifeste, avec l'endroit où elles sont citées. */
function spriteRefs(): { where: string; key: string }[] {
  const refs: { where: string; key: string }[] = [];
  for (const [name, c] of Object.entries(manifest.characters)) {
    refs.push({ where: `characters.${name}.sprite`, key: c.sprite });
    if (c.elite !== undefined) refs.push({ where: `characters.${name}.elite`, key: c.elite });
  }
  for (const group of ['emotes', 'props', 'ui', 'charms', 'fx'] as const) {
    for (const [k, key] of Object.entries(manifest[group])) refs.push({ where: `${group}.${k}`, key });
  }
  for (const [act, t] of Object.entries(manifest.tiles)) {
    refs.push({ where: `tiles.${act}.floor`, key: t.floor });
    refs.push({ where: `tiles.${act}.wall`, key: t.wall });
  }
  return refs;
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
  it('a la version 2 et les groupes attendus', () => {
    expect(manifest.version).toBe(2);
    for (const group of ['sprites', 'characters', 'emotes', 'tiles', 'props', 'ui', 'charms', 'fx', 'audio', 'music', 'fonts', 'credits']) {
      expect(manifest, `groupe ${group}`).toHaveProperty(group);
    }
  });

  it('cite uniquement des fichiers qui existent', () => {
    for (const { where, file } of referencedFiles()) {
      expect(existsSync(join(ROOT, file)), `${where} : ${file} est introuvable`).toBe(true);
    }
  });

  it('range les fichiers dans les dossiers prévus, en minuscules sans espaces', () => {
    const folders = ['sprites', 'audio', 'music', 'fonts'];
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

  it('ne garde aucune image orpheline : chaque PNG présent est un sprite du manifeste', () => {
    const declared = new Set(Object.values(manifest.sprites).map((s) => s.file));
    for (const rel of allFiles.filter((f) => extname(f) === '.png')) {
      expect(declared.has(rel), `${rel} : absent de la table sprites`).toBe(true);
    }
  });
});

describe('sprites', () => {
  it('ont une échelle valide, un fichier PNG et un drapeau pixelArt booléen', () => {
    for (const [key, s] of Object.entries(manifest.sprites)) {
      expect(s.pixelsPerUnit, `${key} : pixelsPerUnit`).toBeGreaterThan(0);
      expect(extname(s.file), `${key} : extension`).toBe('.png');
      if (s.pixelArt !== undefined) expect(typeof s.pixelArt, `${key} : pixelArt`).toBe('boolean');
    }
  });

  it('chaque clé de sprite citée par un groupe existe dans la table sprites', () => {
    for (const { where, key } of spriteRefs()) {
      expect(manifest.sprites, `${where} -> ${key}`).toHaveProperty(key);
    }
  });

  it('les sept bulles d\'émote, les trois actes de tuiles et les accessoires du contrat sont présents', () => {
    for (const k of EMOTE_KEYS) expect(manifest.emotes, `emotes.${k}`).toHaveProperty(k);
    for (const act of ACTS) {
      expect(manifest.tiles, `tiles.${act}`).toHaveProperty(act);
      expect(manifest.tiles[act], `tiles.${act}.floor`).toHaveProperty('floor');
      expect(manifest.tiles[act], `tiles.${act}.wall`).toHaveProperty('wall');
    }
    for (const k of PROP_KEYS) expect(manifest.props, `props.${k}`).toHaveProperty(k);
    for (const k of FX_KEYS) expect(manifest.fx, `fx.${k}`).toHaveProperty(k);
  });

  it('couvrent l\'interface : sept icônes de nœud, monnaie, jauges, cœurs, panneaux', () => {
    for (const k of UI_KEYS) expect(manifest.ui, `ui.${k}`).toHaveProperty(k);
    expect(NODE_KEYS).toHaveLength(7);
  });

  it('proposent douze amulettes distinctes, une image différente chacune', () => {
    expect(Object.keys(manifest.charms).sort()).toEqual([...CHARM_KEYS].sort());
    const files = CHARM_KEYS.map((k) => {
      const key = manifest.charms[k];
      return key === undefined ? '' : manifest.sprites[key]?.file;
    });
    expect(new Set(files).size, 'deux amulettes partagent la même image').toBe(CHARM_KEYS.length);
  });

  it('chaque personnage listé a un sprite, une échelle et une ancre valides, les élites en plus quand elles existent', () => {
    for (const name of CHARACTERS) {
      expect(manifest.characters, `personnage ${name}`).toHaveProperty(name);
      const c = manifest.characters[name];
      if (c === undefined) continue;
      expect(typeof c.sprite, `${name}.sprite`).toBe('string');
      expect(c.scale, `${name}.scale`).toBeGreaterThan(0);
      expect(c.anchorY, `${name}.anchorY`).toBeGreaterThan(0);
      expect(c.anchorY, `${name}.anchorY`).toBeLessThan(1);
      if (CHARACTERS_WITH_ELITE.includes(name)) {
        expect(c.elite, `${name}.elite`).toBeDefined();
        expect(c.elite, `${name} : l'élite doit différer du modèle courant`).not.toBe(c.sprite);
      }
    }
  });

  it('les sprites de personnages ont un fond transparent', () => {
    for (const c of Object.values(manifest.characters)) {
      for (const key of [c.sprite, c.elite]) {
        if (key === undefined) continue;
        const file = manifest.sprites[key]?.file;
        expect(file, `${key} : fichier`).toBeDefined();
        if (file !== undefined) expect(pngHasAlpha(file), `${key} (${file}) : pas de canal alpha`).toBe(true);
      }
    }
  });

  it('marque en pixel art les personnages, les tuiles, les bulles et les amulettes', () => {
    const pixel = (key: string): boolean => manifest.sprites[key]?.pixelArt === true;
    for (const c of Object.values(manifest.characters)) {
      expect(pixel(c.sprite), `${c.sprite}`).toBe(true);
      if (c.elite !== undefined) expect(pixel(c.elite), `${c.elite}`).toBe(true);
    }
    for (const t of Object.values(manifest.tiles)) {
      expect(pixel(t.floor), t.floor).toBe(true);
      expect(pixel(t.wall), t.wall).toBe(true);
    }
    for (const key of [...Object.values(manifest.emotes), ...Object.values(manifest.charms)]) expect(pixel(key), key).toBe(true);
  });

  it('respectent le budget : 256 Ko et 512 px de côté au plus', () => {
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
    const icons = manifest.credits.filter((x) => x.url.startsWith('https://game-icons.net/'));
    expect(icons.length, 'au moins les sept icônes de nœuds de la carte').toBeGreaterThanOrEqual(7);
    for (const c of icons) {
      expect(c.license, c.title).toBe('CC BY 3.0');
      expect(c.attribution).toMatch(/^Icons made by .+\. Available on https:\/\/game-icons\.net$/);
    }
  });

  it('crédite chacune des sept icônes de nœuds de la carte', () => {
    const cited = new Set(manifest.credits.filter((c) => c.license === 'CC BY 3.0').flatMap((c) => c.files));
    for (const k of NODE_KEYS) {
      const key = manifest.ui[k];
      const file = key === undefined ? undefined : manifest.sprites[key]?.file;
      expect(file, `ui.${k}`).toBeDefined();
      if (file !== undefined) expect(cited.has(file), `${file} : crédit CC BY 3.0 manquant`).toBe(true);
    }
  });
});

describe('budget de taille global', () => {
  it('public/assets/ pèse 15 Mo au plus, musique comprise', () => {
    const total = allFiles.reduce((sum, rel) => sum + sizeOf(rel), 0);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });
});
