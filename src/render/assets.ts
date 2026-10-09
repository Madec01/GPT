/**
 * Manifeste d'assets et chargement. Le manifeste est le contrat entre le
 * sous-agent Assets et le code : clés fixes, fichiers libres. Une clé absente
 * ou `null` déclenche un substitut vectoriel dans le rendu, jamais un plantage.
 *
 * Version 2 : un sprite par personnage, variante d'élite, bulles d'émote,
 * tuiles par acte, icônes de nœuds et de charmes, pixel art agrandi sans flou.
 */
import type { Texture } from 'pixi.js';
import { Assets } from 'pixi.js';

export type HeroExpression = 'neutral' | 'aim' | 'flight' | 'impact' | 'happy' | 'worried' | 'hit';
export type EnemyExpression = 'neutral' | 'stunned' | 'hit';
export type Expression = HeroExpression | EnemyExpression;

export interface SpriteDef {
  file: string;
  /** Pixels de l'image qui valent une unité d'arène. */
  pixelsPerUnit: number;
  /** Agrandi sans lissage. */
  pixelArt?: boolean;
}

export interface CharacterDef {
  sprite: string | null;
  /** Sprite de la variante d'élite, sinon le sprite ordinaire teinté. */
  elite?: string | null;
  /** Taille du sprite par rapport au diamètre du corps, 1,2 par défaut. */
  scale?: number;
  /** Ancrage vertical, 0,5 au centre, plus grand vers les pieds. */
  anchorY?: number;
}

export interface TileSetDef {
  floor: string | null;
  wall: string | null;
}

export interface AudioDef {
  file: string;
  volume?: number;
}

export interface FontDef {
  family: string;
  file: string;
}

export interface CreditDef {
  files: string[];
  title: string;
  author: string;
  license: string;
  url: string;
  attribution?: string;
}

export interface AssetManifest {
  version: number;
  sprites: Record<string, SpriteDef>;
  characters: Partial<Record<string, CharacterDef>>;
  emotes?: Partial<Record<string, string | null>>;
  tiles?: Partial<Record<string, TileSetDef>>;
  props: Partial<Record<string, string | null>>;
  /** Teinte du sol en hexadécimal CSS, optionnelle. */
  floorTint?: string | null;
  ui: Partial<Record<string, string | null>>;
  charms?: Partial<Record<string, string | null>>;
  fx: Partial<Record<string, string | null>>;
  audio: Record<string, AudioDef>;
  music: Record<string, string>;
  fonts: Partial<Record<'title' | 'text', FontDef>>;
  credits: CreditDef[];
}

/** Textures chargées, interrogeables par clé de sprite ou par clé de prop, d'interface ou d'effet. */
export class AssetBundle {
  private readonly textures = new Map<string, Texture>();

  constructor(
    readonly manifest: AssetManifest,
    readonly baseUrl: string,
  ) {}

  /** Teinte du sol, en nombre 0xRRGGBB, ou null. */
  floorTint(): number | null {
    const tint = this.manifest.floorTint;
    if (!tint) return null;
    const parsed = Number.parseInt(tint.replace('#', ''), 16);
    return Number.isFinite(parsed) ? parsed : null;
  }

  register(key: string, texture: Texture): void {
    this.textures.set(key, texture);
  }

  /** Texture d'une clé de sprite, ou `null`. */
  texture(key: string | null | undefined): Texture | null {
    if (!key) return null;
    return this.textures.get(key) ?? null;
  }

  /** Pixels par unité d'une clé de sprite, 128 par défaut. */
  pixelsPerUnit(key: string | null | undefined): number {
    if (!key) return 128;
    return this.manifest.sprites[key]?.pixelsPerUnit ?? 128;
  }

  prop(name: string): Texture | null {
    return this.texture(this.propKey(name));
  }

  propKey(name: string): string | null {
    return this.manifest.props[name] ?? null;
  }

  /** Tuile de sol ou de mur d'un acte ; l'acte 1 sert de repli. */
  tile(act: number, part: 'floor' | 'wall'): Texture | null {
    return this.texture(this.tileKey(act, part));
  }

  tileKey(act: number, part: 'floor' | 'wall'): string | null {
    const sets = this.manifest.tiles;
    const set = sets?.[String(act)] ?? sets?.['1'];
    return set?.[part] ?? this.manifest.props[part] ?? null;
  }

  ui(name: string): Texture | null {
    return this.texture(this.manifest.ui[name]);
  }

  fx(name: string): Texture | null {
    return this.texture(this.manifest.fx[name]);
  }

  emote(name: string): Texture | null {
    return this.texture(this.manifest.emotes?.[name]);
  }

  charm(id: string): Texture | null {
    return this.texture(this.manifest.charms?.[id]);
  }

  character(kind: string): CharacterDef | null {
    return this.manifest.characters[kind] ?? null;
  }

  fontFamily(role: 'title' | 'text', fallback: string): string {
    const def = this.manifest.fonts[role];
    return def ? `"${def.family}", ${fallback}` : fallback;
  }

  url(file: string): string {
    return `${this.baseUrl}${file}`;
  }
}

async function fetchManifest(url: string): Promise<AssetManifest | null> {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) return null;
    return (await response.json()) as AssetManifest;
  } catch {
    return null;
  }
}

/**
 * Charge le manifeste, les textures et les polices. Renvoie `null` si le
 * manifeste est absent ou d'une autre version : le jeu tourne alors en formes
 * vectorielles.
 */
export async function loadAssets(baseUrl: string): Promise<AssetBundle | null> {
  let manifest = await fetchManifest(`${baseUrl}manifest.json`);
  if (manifest && manifest.version !== 2) {
    // Un service worker a pu servir un manifeste périmé : on le redemande au réseau, hors cache.
    console.warn(`Manifeste d'assets en version ${manifest.version}, 2 attendue : nouvelle lecture réseau.`);
    manifest = await fetchManifest(`${baseUrl}manifest.json?v=${Date.now()}`);
  }
  if (!manifest) return null;
  if (manifest.version !== 2) {
    console.warn(`Manifeste d'assets en version ${manifest.version}, 2 attendue : formes vectorielles.`);
    return null;
  }
  const bundle = new AssetBundle(manifest, baseUrl);

  const entries = Object.entries(manifest.sprites);
  const loads = entries.map(async ([key, def]) => {
    try {
      const texture = await Assets.load<Texture>({
        alias: key,
        src: bundle.url(def.file),
        data: def.pixelArt ? { scaleMode: 'nearest' } : {},
      });
      bundle.register(key, texture);
    } catch (error) {
      console.warn(`Asset introuvable : ${key} (${def.file})`, error);
    }
  });
  const fonts = Object.values(manifest.fonts).map(async (def) => {
    if (!def) return;
    try {
      // Les polices variables exposent toute leur plage de graisses ; une statique s'en accommode.
      const face = new FontFace(def.family, `url(${bundle.url(def.file)})`, { weight: '100 1000' });
      await face.load();
      document.fonts.add(face);
    } catch (error) {
      console.warn(`Police introuvable : ${def.family}`, error);
    }
  });
  await Promise.all([...loads, ...fonts]);
  return bundle;
}
