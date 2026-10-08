/**
 * Rendu PixiJS. Aucune règle de jeu ici : le renderer lit le monde ECS et
 * dessine. Couches, du fond vers l'avant : sol et murs, props statiques,
 * zones au sol, trace fantôme, particules, corps mobiles, aperçu de visée ;
 * puis, en pixels d'écran, l'interface, l'indicateur de geste et les écrans.
 *
 * Avec un lot d'assets, les corps et les props sont des sprites ; sans, ou
 * pour une clé manquante, des formes vectorielles prennent le relais.
 */
import { Application, Container, Graphics, Sprite, Text, TilingSprite, type Texture } from 'pixi.js';
import type { Entity, World } from '../core/ecs/world';
import type { Vec2 } from '../core/math/vec2';
import { BoxShape, CircleBody, Transform, Velocity } from '../core/physics';
import type { AimState } from '../input/gesture';
import { DEFAULT_GESTURE, type GestureConfig } from '../input/gesture';
import { Breakable, Enemy, Hazard, Health, Kind, Pickup, Springboard } from '../sim/components';
import type { Zone } from '../sim/zones';
import type { AssetBundle, Expression } from './assets';
import { DEFAULT_MARGINS, fitArena, toArena, toScreen, type Camera, type Margins } from './camera';
import { CharacterView } from './characterView';
import type { DisclosedPreview } from './disclosure';
import { ParticleSystem, type BurstOptions } from './fx';
import { HudView, type HudState } from './hudView';
import { MapView, type MapSpec } from './mapView';
import { OverlayView, type OverlaySpec } from './overlayView';

export type { HudState } from './hudView';
export type { MapSpec } from './mapView';
export type { OverlayButton, OverlaySpec } from './overlayView';

const COLORS = {
  background: 0x1b1d22,
  floor: 0x272a31,
  wall: 0x6b7280,
  box: 0x4b5563,
  boxEdge: 0x9ca3af,
  crate: 0x8b6b3f,
  barricade: 0x6b4a2b,
  column: 0x9ca3af,
  pit: 0x0b0c0f,
  goal: 0x4ade80,
  spring: 0x60a5fa,
  explosive: 0xf97316,
  crack: 0x111318,
  heart: 0xf472b6,
  hero: 0xfde68a,
  heroEdge: 0xb45309,
  crapaud: 0x86efac,
  gelee: 0xc084fc,
  rocailleux: 0xa8a29e,
  boss: 0xf87171,
  egg: 0xfef3c7,
  boulder: 0x78716c,
  edge: 0x111318,
  zone: 0xef4444,
  zoneStunned: 0x6b7280,
  zoneHarmless: 0xf59e0b,
  shield: 0xcbd5e1,
  roleHealer: 0x4ade80,
  roleArtificer: 0xf97316,
  roleBuilder: 0xfbbf24,
  preview: 0xf9fafb,
  stopSafe: 0x22c55e,
  stopUncertain: 0xf59e0b,
  stopDanger: 0xef4444,
  trail: 0x93c5fd,
  aim: 0xfde68a,
  spark: 0xfde68a,
  dust: 0x9ca3af,
  wood: 0xa16207,
  stone: 0x9ca3af,
} as const;

const KIND_COLORS: Record<string, number> = {
  hero: COLORS.hero,
  crapaud: COLORS.crapaud,
  gelee: COLORS.gelee,
  rocailleux: COLORS.rocailleux,
  boss: COLORS.boss,
  egg: COLORS.egg,
  boulder: COLORS.boulder,
};

export interface ZoneDrawing {
  zones: Zone[];
  stunned: boolean;
  /** Zone d'action sans dégâts : soin ou pose. */
  harmless: boolean;
}

export type MarkerState = 'safe' | 'uncertain' | 'danger';

export type FxKind = 'spark' | 'dust' | 'wood' | 'stone' | 'glow' | 'mote';

/** Texture, teinte et couleur de repli par genre de boîte. Le ressort et l'explosif réutilisent la caisse, teintée. */
const BOX_TEXTURE: Record<string, string> = { crate: 'crate', barricade: 'barricade', column: 'column', explosive: 'explosive', ressort: 'ressort', box: 'crate' };
const BOX_TINT: Record<string, number> = { explosive: COLORS.explosive, ressort: COLORS.spring };
const BOX_FILL: Record<string, number> = {
  crate: COLORS.crate,
  barricade: COLORS.barricade,
  column: COLORS.column,
  explosive: COLORS.explosive,
  ressort: COLORS.spring,
};

/** Suite pseudo-aléatoire stable par entité, pour que les fissures ne tremblent pas d'une image à l'autre. */
function hash01(seed: number, i: number): number {
  let h = (seed * 374761393 + i * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Fissures en zigzag, une par cran de solidité perdu, du haut vers le bas de la boîte. */
function drawCracks(g: Graphics, entity: number, count: number, x: number, y: number, w: number, h: number): void {
  for (let i = 0; i < count; i++) {
    const seed = entity * 7 + i * 31;
    let px = x + w * (0.2 + 0.6 * hash01(seed, 0));
    let py = y;
    g.moveTo(px, py);
    const steps = 4;
    for (let k = 1; k <= steps; k++) {
      px += (hash01(seed, k) - 0.5) * w * 0.3;
      px = Math.max(x + 2, Math.min(x + w - 2, px));
      py = y + (h * k) / steps;
      g.lineTo(px, py);
    }
    g.stroke({ width: 2, color: COLORS.crack, alpha: 0.85 });
  }
}

/** Marges d'interface augmentées des zones sûres de l'appareil, lues depuis les variables CSS. */
function safeInsets(): { top: number; bottom: number } {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): number => Number.parseFloat(style.getPropertyValue(name)) || 0;
  return { top: read('--safe-top'), bottom: read('--safe-bottom') };
}

function safeMargins(): Margins {
  const insets = safeInsets();
  return { top: DEFAULT_MARGINS.top + insets.top, bottom: DEFAULT_MARGINS.bottom + insets.bottom, side: DEFAULT_MARGINS.side };
}

interface PropView {
  node: Sprite | TilingSprite | Graphics;
  kind: string;
}

export class PixiRenderer {
  camera: Camera;
  private margins: Margins;
  private readonly arena = new Container();
  private readonly floorLayer = new Container();
  private readonly staticsGfx = new Graphics();
  private readonly propsLayer = new Container();
  private readonly cracks = new Graphics();
  private readonly zones = new Graphics();
  private readonly trail = new Graphics();
  private readonly particles = new ParticleSystem();
  private readonly bodiesLayer = new Container();
  private readonly arcs = new Graphics();
  private arcList: Array<{ x1: number; y1: number; x2: number; y2: number; life: number }> = [];
  private readonly preview = new Graphics();
  private readonly aimIndicator = new Graphics();
  /** Masque rectangulaire de l'arène : zones, particules et aperçu ne débordent jamais (B-001). */
  private readonly arenaMask = new Graphics();
  private readonly flashLayer = new Graphics();
  private readonly mapView: MapView;
  private shakeMs = 0;
  private shakeStrength = 0;
  private flashAlpha = 0;
  private readonly textsLayer = new Container();
  private readonly texts: Array<{ node: Text; t: number; life: number; vy: number }> = [];
  private readonly textPool: Text[] = [];
  private act = 1;
  private fadeAlpha = 0;
  private zoneTime = 0;
  private zonePopT = 1;
  private moteTimer = 0;
  private readonly hud: HudView;
  private readonly overlay: OverlayView;
  private readonly characters = new Map<Entity, CharacterView>();
  private readonly props = new Map<Entity, PropView>();
  private goalNode: Sprite | Graphics | null = null;

  private constructor(
    readonly app: Application,
    arenaWidth: number,
    arenaHeight: number,
    private readonly gestureConfig: GestureConfig,
    readonly assets: AssetBundle | null,
  ) {
    this.margins = safeMargins();
    this.camera = fitArena(app.screen.width, app.screen.height, arenaWidth, arenaHeight, this.margins);
    this.hud = new HudView(assets);
    this.overlay = new OverlayView(assets);
    this.arena.addChild(this.floorLayer, this.staticsGfx, this.propsLayer, this.cracks, this.zones, this.trail, this.particles.root, this.bodiesLayer, this.arcs, this.preview, this.arenaMask);
    this.zones.mask = this.arenaMask;
    this.preview.mask = this.arenaMask;
    this.particles.root.mask = this.arenaMask;
    this.mapView = new MapView(assets);
    this.mapView.hide();
    this.arena.addChild(this.textsLayer);
    app.stage.addChild(this.arena, this.flashLayer, this.hud.root, this.aimIndicator, this.mapView.root, this.overlay.root);
  }

  static async create(
    parent: HTMLElement,
    arenaWidth: number,
    arenaHeight: number,
    assets: AssetBundle | null = null,
    gestureConfig: GestureConfig = DEFAULT_GESTURE,
  ): Promise<PixiRenderer> {
    const app = new Application();
    await app.init({
      background: COLORS.background,
      resizeTo: window,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    parent.appendChild(app.canvas);
    const renderer = new PixiRenderer(app, arenaWidth, arenaHeight, gestureConfig, assets);
    app.renderer.on('resize', () => renderer.onResize());
    return renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /** Change d'arène en entrant dans une nouvelle salle : vide les vues d'entités. */
  setArena(arenaWidth: number, arenaHeight: number, act = 1): void {
    this.act = act;
    this.camera = fitArena(this.app.screen.width, this.app.screen.height, arenaWidth, arenaHeight, this.margins);
    for (const view of this.characters.values()) view.destroy();
    this.characters.clear();
    for (const prop of this.props.values()) prop.node.destroy();
    this.props.clear();
    this.goalNode?.destroy();
    this.goalNode = null;
    this.rebuildFloor();
  }

  private onResize(): void {
    this.margins = safeMargins();
    this.camera = fitArena(this.app.screen.width, this.app.screen.height, this.camera.arenaWidth, this.camera.arenaHeight, this.margins);
    this.rebuildFloor();
  }

  hitBrake(x: number, y: number): boolean {
    return this.hud.hitBrake(x, y);
  }

  hitPause(x: number, y: number): boolean {
    return this.hud.hitPause(x, y);
  }

  hitOverlayButton(x: number, y: number): string | null {
    return this.overlay.hit(x, y);
  }

  /** Carte du run par-dessus l'arène ; null la cache et rend l'arène. */
  drawMap(spec: MapSpec | null): void {
    const insets = safeInsets();
    if (spec) {
      this.mapView.layout(this.app.screen.width, this.app.screen.height, insets.top, insets.bottom);
      this.mapView.show(spec);
    } else {
      this.mapView.hide();
    }
    this.arena.visible = spec === null;
    this.hud.root.visible = spec === null;
  }

  hitMap(x: number, y: number): string | null {
    return this.mapView.hitTest(x, y);
  }

  /** Secousse de caméra en pixels, cumulable, qui s'amortit en un quart de seconde. */
  shake(strength: number): void {
    this.shakeStrength = Math.min(14, Math.max(this.shakeStrength, strength));
    this.shakeMs = 240;
  }

  /** Flash blanc plein écran qui s'estompe. */
  flash(alpha: number): void {
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  /** Saut visuel d'un corps depuis un décalage d'arène vers sa vraie position. */
  hop(entity: Entity, dx: number, dy: number): void {
    this.characters.get(entity)?.hop(dx * this.camera.scale, dy * this.camera.scale);
  }

  /** Charge d'un ennemi vers un point d'arène, puis retour. */
  lunge(entity: Entity, towardX: number, towardY: number): void {
    const view = this.characters.get(entity);
    if (!view) return;
    const from = toArena(this.camera, view.root.x, view.root.y);
    view.lunge(towardX - from.x, towardY - from.y);
  }

  /** Anticipation de visée du héros : étiré vers la direction du lancer, selon la puissance. */
  anticipate(entity: Entity, dirX: number, dirY: number, strength: number): void {
    this.characters.get(entity)?.anticipate(Math.atan2(dirY, dirX), strength);
  }

  /** Texte flottant à une position d'arène : chiffre de dégâts, annonce. */
  floatText(x: number, y: number, text: string, color: number, size = 22): void {
    const p = toScreen(this.camera, x, y);
    const node = this.textPool.pop() ?? new Text({ text: '', style: { fontFamily: this.assets?.fontFamily('title', 'system-ui, sans-serif') ?? 'system-ui, sans-serif', fontWeight: '400', stroke: { color: 0x111318, width: 4 } } });
    node.text = text;
    node.style.fontSize = size;
    node.style.fill = color;
    node.anchor.set(0.5);
    node.x = p.x;
    node.y = p.y - 12;
    node.alpha = 1;
    node.scale.set(0.6);
    node.visible = true;
    this.textsLayer.addChild(node);
    this.texts.push({ node, t: 0, life: 0.9, vy: -46 });
  }

  /** Fondu depuis le noir à l'entrée d'une salle. */
  fadeIn(): void {
    this.fadeAlpha = 1;
  }

  /** Les zones viennent d'être annoncées : elles apparaissent avec un éclat. */
  telegraph(): void {
    this.zonePopT = 0;
  }

  private rebuildFloor(): void {
    for (const child of this.floorLayer.removeChildren()) child.destroy();
    const c = this.camera;
    const origin = toScreen(c, 0, 0);
    const width = c.arenaWidth * c.scale;
    const height = c.arenaHeight * c.scale;
    this.arenaMask.clear().rect(origin.x, origin.y, width, height).fill(0xffffff);
    const floorTexture = this.assets?.tile(this.act, 'floor') ?? null;
    if (floorTexture) {
      const tile = new TilingSprite({ texture: floorTexture, width, height });
      const scale = c.scale / this.assets!.pixelsPerUnit(this.assets!.tileKey(this.act, 'floor'));
      tile.tileScale.set(scale);
      const tint = this.assets!.floorTint();
      if (tint !== null) tile.tint = tint;
      tile.x = origin.x;
      tile.y = origin.y;
      this.floorLayer.addChild(tile);
    } else {
      this.floorLayer.addChild(new Graphics().rect(origin.x, origin.y, width, height).fill(COLORS.floor));
    }
    const wallTexture = this.assets?.tile(this.act, 'wall') ?? null;
    const thickness = Math.max(6, 0.35 * c.scale);
    if (wallTexture) {
      const scale = c.scale / this.assets!.pixelsPerUnit(this.assets!.tileKey(this.act, 'wall'));
      const strips: Array<[number, number, number, number]> = [
        [origin.x - thickness, origin.y - thickness, width + thickness * 2, thickness],
        [origin.x - thickness, origin.y + height, width + thickness * 2, thickness],
        [origin.x - thickness, origin.y, thickness, height],
        [origin.x + width, origin.y, thickness, height],
      ];
      for (const [x, y, w, h] of strips) {
        const strip = new TilingSprite({ texture: wallTexture, width: w, height: h });
        strip.tileScale.set(scale);
        strip.x = x;
        strip.y = y;
        this.floorLayer.addChild(strip);
      }
    } else {
      this.floorLayer.addChild(new Graphics().rect(origin.x, origin.y, width, height).stroke({ width: 3, color: COLORS.wall }));
    }
  }

  /** Décor statique : gouffres, tremplins, boîtes, cœurs. Les sprites persistent, les formes sont redessinées. */
  drawStatics(world: World): void {
    const g = this.staticsGfx;
    const c = this.camera;
    g.clear();
    const seen = new Set<Entity>();

    for (const entity of world.query(Hazard)) {
      seen.add(entity);
      const zone = world.require(entity, Hazard).zone;
      const texture = this.assets?.prop('pit') ?? null;
      if (texture) this.syncZoneSprite(entity, 'pit', texture, zone);
      else this.fillZone(g, zone, COLORS.pit, 1, COLORS.wall, 0.6);
    }
    for (const entity of world.query(Springboard)) {
      seen.add(entity);
      const s = world.require(entity, Springboard);
      const texture = this.assets?.prop('spring') ?? null;
      if (texture) {
        // La flèche de la texture pointe vers le haut : on la tourne vers la direction du tremplin.
        this.syncZoneSprite(entity, 'spring', texture, s.zone, Math.atan2(s.dirY, s.dirX) + Math.PI / 2);
      } else {
        this.fillZone(g, s.zone, COLORS.spring, 0.25, COLORS.spring, 0.9);
        this.drawArrow(g, s.zone, s.dirX, s.dirY);
      }
    }
    const cracks = this.cracks;
    cracks.clear();
    for (const entity of world.query(Transform, BoxShape)) {
      seen.add(entity);
      const t = world.require(entity, Transform);
      const box = world.require(entity, BoxShape);
      const breakable = world.get(entity, Breakable);
      const kind = breakable?.breakableKind ?? world.get(entity, Kind)?.kind ?? 'box';
      const cracked = breakable !== undefined && breakable.solidity < breakable.maxSolidity;
      const dedicated = this.assets?.prop(kind === 'column' && cracked ? 'columnCracked' : (BOX_TEXTURE[kind] ?? 'crate')) ?? null;
      const texture = dedicated ?? this.assets?.prop(kind === 'column' ? 'column' : 'crate') ?? null;
      const tinted = dedicated === null;
      const w = box.halfWidth * 2 * c.scale;
      const h = box.halfHeight * 2 * c.scale;
      const p = toScreen(c, t.x - box.halfWidth, t.y - box.halfHeight);
      if (texture) {
        this.syncBoxSprite(entity, kind === 'column' && cracked ? 'column-cracked' : kind, texture, p.x, p.y, w, h, tinted ? (BOX_TINT[kind] ?? 0xffffff) : 0xffffff);
      } else {
        const fill = BOX_FILL[kind] ?? COLORS.box;
        g.rect(p.x, p.y, w, h).fill(fill).stroke({ width: 2, color: COLORS.boxEdge });
      }
      if (breakable && cracked && dedicated === null) {
        drawCracks(cracks, entity, breakable.maxSolidity - breakable.solidity, p.x, p.y, w, h);
      }
    }
    for (const entity of world.query(Pickup)) {
      seen.add(entity);
      const p = world.require(entity, Pickup);
      const s = toScreen(c, p.x, p.y);
      const texture = this.assets?.prop('heart') ?? null;
      if (texture) this.syncCenteredSprite(entity, 'heart', texture, s.x, s.y, p.r * 2 * c.scale);
      else g.circle(s.x, s.y, p.r * c.scale).fill(COLORS.heart).stroke({ width: 2, color: COLORS.edge });
    }
    for (const [entity, prop] of this.props) {
      if (!seen.has(entity)) {
        prop.node.destroy();
        this.props.delete(entity);
      }
    }
  }

  private propNode(entity: Entity, kind: string, make: () => Sprite | TilingSprite): PropView {
    let prop = this.props.get(entity);
    if (!prop || prop.kind !== kind) {
      prop?.node.destroy();
      prop = { node: make(), kind };
      this.propsLayer.addChild(prop.node);
      this.props.set(entity, prop);
    }
    return prop;
  }

  private syncBoxSprite(entity: Entity, kind: string, texture: Texture, x: number, y: number, w: number, h: number, tint: number): void {
    const prop = this.propNode(entity, kind, () =>
      kind === 'barricade' ? new TilingSprite({ texture, width: w, height: h }) : new Sprite(texture),
    );
    const node = prop.node;
    if (node instanceof TilingSprite) {
      node.width = w;
      node.height = h;
      const scale = h / texture.height;
      node.tileScale.set(scale);
      node.tint = tint;
    } else if (node instanceof Sprite) {
      if (node.texture !== texture) node.texture = texture;
      node.width = w;
      node.height = h;
      node.tint = tint;
    }
    node.x = x;
    node.y = y;
  }

  private syncCenteredSprite(entity: Entity, kind: string, texture: Texture, x: number, y: number, size: number): void {
    const prop = this.propNode(entity, kind, () => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      return sprite;
    });
    const node = prop.node as Sprite;
    const s = size / Math.max(texture.width, texture.height);
    node.scale.set(s);
    node.x = x;
    node.y = y;
  }

  private syncZoneSprite(entity: Entity, kind: string, texture: Texture, zone: Zone, rotation = 0): void {
    const c = this.camera;
    const box = zoneBounds(zone);
    const center = toScreen(c, box.x + box.width / 2, box.y + box.height / 2);
    const prop = this.propNode(entity, kind, () => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      return sprite;
    });
    const node = prop.node as Sprite;
    const sideways = Math.abs(Math.cos(rotation)) < 0.5;
    node.width = (sideways ? box.height : box.width) * c.scale;
    node.height = (sideways ? box.width : box.height) * c.scale;
    node.rotation = rotation;
    node.x = center.x;
    node.y = center.y;
  }

  /** Cible d'un objectif "pousser". */
  drawGoal(goal: Zone | null): void {
    if (!goal) {
      this.goalNode?.destroy();
      this.goalNode = null;
      return;
    }
    const c = this.camera;
    const texture = this.assets?.prop('goal') ?? null;
    if (texture && goal.kind === 'disc') {
      if (!(this.goalNode instanceof Sprite)) {
        this.goalNode?.destroy();
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        this.propsLayer.addChildAt(sprite, 0);
        this.goalNode = sprite;
      }
      const p = toScreen(c, goal.x, goal.y);
      const size = goal.r * 2 * c.scale;
      this.goalNode.scale.set(size / Math.max(texture.width, texture.height));
      this.goalNode.x = p.x;
      this.goalNode.y = p.y;
      return;
    }
    if (!(this.goalNode instanceof Graphics)) {
      this.goalNode?.destroy();
      this.goalNode = new Graphics();
      this.propsLayer.addChildAt(this.goalNode, 0);
    }
    this.goalNode.clear();
    this.fillZone(this.goalNode, goal, COLORS.goal, 0.12, COLORS.goal, 0.9);
  }

  drawZones(zones: readonly ZoneDrawing[]): void {
    const g = this.zones;
    g.clear();
    const pop = Math.min(1, this.zonePopT / 0.3);
    const pulse = 0.85 + 0.15 * Math.sin(this.zoneTime * 4);
    for (const { zones: list, stunned, harmless } of zones) {
      const color = stunned ? COLORS.zoneStunned : harmless ? COLORS.zoneHarmless : COLORS.zone;
      const fillAlpha = (stunned ? 0.1 : 0.2 * pulse) * pop;
      const strokeAlpha = (stunned ? 0.4 : 0.8) * pop + (1 - pop) * 0.9;
      for (const zone of list) this.fillZone(g, zone, color, fillAlpha, color, strokeAlpha);
    }
  }

  /** Corps mobiles : vues persistantes, créées et détruites au fil des entités. */
  drawDynamics(world: World, hero: Entity, expressions: ReadonlyMap<Entity, Expression>, dt: number, elite = false): void {
    const c = this.camera;
    const seen = new Set<Entity>();
    for (const entity of world.query(Transform, CircleBody)) {
      seen.add(entity);
      const t = world.require(entity, Transform);
      const body = world.require(entity, CircleBody);
      const kind = world.get(entity, Kind)?.kind ?? 'dummy';
      let view = this.characters.get(entity);
      if (!view) {
        const isHero = entity === hero;
        const enemyHere = world.get(entity, Enemy);
        view = new CharacterView(
          this.assets,
          kind,
          { fill: KIND_COLORS[kind] ?? COLORS.box, edge: isHero ? COLORS.heroEdge : COLORS.edge, eyes: isHero },
          elite && enemyHere !== undefined,
          isHero,
        );
        this.bodiesLayer.addChild(view.root);
        this.characters.set(entity, view);
      }
      const p = toScreen(c, t.x, t.y);
      view.setExpression(expressions.get(entity) ?? 'neutral');
      const enemy = world.get(entity, Enemy);
      view.setStunned(enemy?.stunned ?? false);
      const v = world.get(entity, Velocity);
      view.update(p.x, p.y, body.radius * c.scale, dt, (v?.x ?? 0) * c.scale, (v?.y ?? 0) * c.scale);
      this.drawHealthPips(entity, world, p.x, p.y - body.radius * c.scale - 10);
      if (enemy) this.drawShieldAndRole(enemy, p.x, p.y, body.radius * c.scale);
    }
    for (const [entity, view] of this.characters) {
      if (!seen.has(entity)) {
        view.destroy();
        this.characters.delete(entity);
      }
    }
  }

  private readonly pips = new Graphics();
  private pipsAttached = false;

  /** Bouclier : arc épais tourné vers le héros. Rôle : pastille colorée en haut à droite du corps. */
  private drawShieldAndRole(enemy: Enemy, x: number, y: number, radiusPx: number): void {
    const g = this.pips;
    if (enemy.shield) {
      const r = radiusPx * 1.12;
      const a = Math.atan2(enemy.shieldY, enemy.shieldX);
      const start = a - Math.PI / 2;
      const end = a + Math.PI / 2;
      g.moveTo(x + Math.cos(start) * r, y + Math.sin(start) * r)
        .arc(x, y, r, start, end)
        .stroke({ width: 7, color: COLORS.edge, alpha: 0.9 });
      g.moveTo(x + Math.cos(start) * r, y + Math.sin(start) * r)
        .arc(x, y, r, start, end)
        .stroke({ width: 4, color: COLORS.shield });
    }
    if (enemy.role === 'none') return;
    const bx = x + radiusPx * 0.75;
    const by = y - radiusPx * 0.75;
    const color = enemy.role === 'guerisseur' ? COLORS.roleHealer : enemy.role === 'artificier' ? COLORS.roleArtificer : COLORS.roleBuilder;
    g.circle(bx, by, 8).fill(color).stroke({ width: 2, color: COLORS.edge });
    if (enemy.role === 'guerisseur') {
      g.rect(bx - 4, by - 1.5, 8, 3).fill(0xffffff);
      g.rect(bx - 1.5, by - 4, 3, 8).fill(0xffffff);
    } else if (enemy.role === 'artificier') {
      g.rect(bx - 1.5, by - 5, 3, 6).fill(0xffffff);
      g.circle(bx, by + 3.5, 1.6).fill(0xffffff);
    } else {
      g.rect(bx - 4.5, by - 3, 9, 6).fill(0xffffff);
      g.rect(bx - 0.75, by - 3, 1.5, 6).fill(color);
    }
  }

  private drawHealthPips(entity: Entity, world: World, x: number, y: number): void {
    if (!this.pipsAttached) {
      this.bodiesLayer.addChild(this.pips);
      this.pipsAttached = true;
    }
    const health = world.get(entity, Health);
    if (!health || !world.has(entity, Enemy)) return;
    const pipWidth = 6;
    const total = health.max * (pipWidth + 2);
    this.pips.roundRect(x - total / 2 - 3, y - 3, total + 4, 10, 4).fill({ color: 0x111318, alpha: 0.75 });
    for (let i = 0; i < health.max; i++) {
      this.pips.rect(x - total / 2 + i * (pipWidth + 2), y, pipWidth, 4).fill(i < health.hp ? 0xf3e9d2 : 0x6b7280);
    }
  }

  /** À appeler avant `drawDynamics` à chaque image. */
  beginFrame(dt: number): void {
    this.pips.clear();
    this.particles.update(dt);
    this.drawArcs(dt);
    this.mapView.update(dt);
    if (this.shakeMs > 0) {
      this.shakeMs = Math.max(0, this.shakeMs - dt * 1000);
      const k = (this.shakeMs / 240) * this.shakeStrength;
      this.arena.position.set((Math.random() * 2 - 1) * k, (Math.random() * 2 - 1) * k);
      if (this.shakeMs === 0) this.shakeStrength = 0;
    } else {
      this.arena.position.set(0, 0);
    }
    this.flashLayer.clear();
    if (this.flashAlpha > 0.01) {
      this.flashLayer.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0xffffff, alpha: this.flashAlpha });
      this.flashAlpha *= Math.max(0, 1 - dt * 9);
    } else {
      this.flashAlpha = 0;
    }
    this.zoneTime += dt;
    this.zonePopT += dt;
    if (this.fadeAlpha > 0) {
      this.flashLayer.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0x000000, alpha: this.fadeAlpha });
      this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 3);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const ft = this.texts[i]!;
      ft.t += dt;
      const u = ft.t / ft.life;
      ft.node.y += ft.vy * dt;
      ft.node.scale.set(u < 0.12 ? 0.6 + (u / 0.12) * 0.5 : 1.1 - Math.min(0.1, (u - 0.12) * 0.3));
      ft.node.alpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
      if (u >= 1) {
        ft.node.visible = false;
        this.textsLayer.removeChild(ft.node);
        this.textPool.push(ft.node);
        this.texts.splice(i, 1);
      }
    }
    // Poussières en suspension dans l'arène, pour que l'image ne soit jamais tout à fait immobile.
    this.moteTimer += dt;
    if (this.moteTimer > 0.35 && this.arena.visible) {
      this.moteTimer = 0;
      const c = this.camera;
      const x = Math.random() * c.arenaWidth;
      const y = Math.random() * c.arenaHeight;
      this.burst('mote', x, y, 1);
    }
  }

  /** Arc électrique d'un point d'arène à un autre, visible un court instant. */
  arc(x1: number, y1: number, x2: number, y2: number): void {
    this.arcList.push({ x1, y1, x2, y2, life: 0.18 });
  }

  private drawArcs(dt: number): void {
    const g = this.arcs;
    g.clear();
    const c = this.camera;
    this.arcList = this.arcList.filter((a) => (a.life -= dt) > 0);
    for (const a of this.arcList) {
      const p1 = toScreen(c, a.x1, a.y1);
      const p2 = toScreen(c, a.x2, a.y2);
      const mx = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.18;
      const my = (p1.y + p2.y) / 2 - (p2.x - p1.x) * 0.18;
      g.moveTo(p1.x, p1.y).lineTo(mx, my).lineTo(p2.x, p2.y).stroke({ width: 3, color: 0x93c5fd, alpha: Math.min(1, a.life * 8) });
      g.moveTo(p1.x, p1.y).lineTo(mx, my).lineTo(p2.x, p2.y).stroke({ width: 1, color: 0xffffff, alpha: Math.min(1, a.life * 8) });
    }
  }

  /** Teinte du corps du héros selon sa forme. */
  setHeroTint(hero: Entity, form: string): void {
    const view = this.characters.get(hero);
    if (!view) return;
    const tint = form === 'pierre' ? 0xb8b4ad : form === 'rebond' ? 0xbfe3ff : form === 'glu' ? 0xc8f0a8 : 0xffffff;
    view.setTint(tint);
  }

  /** Écrasement d'un corps le long d'une normale d'arène. */
  punch(entity: Entity, nx: number, ny: number, strength: number): void {
    const view = this.characters.get(entity);
    if (!view) return;
    view.punch(Math.atan2(ny, nx), strength);
  }

  /** Éclat de particules à une position d'arène. */
  burst(kind: FxKind, x: number, y: number, count: number, angle: number | null = null): void {
    const c = this.camera;
    const p = toScreen(c, x, y);
    const presets: Record<FxKind, Omit<BurstOptions, 'count' | 'angle' | 'texture'>> = {
      spark: { speed: 260, life: 0.35, size: 7, color: COLORS.spark, spread: Math.PI * 0.9 },
      glow: { speed: 60, life: 0.3, size: 18, color: COLORS.spark, spread: Math.PI * 2 },
      dust: { speed: 90, life: 0.6, size: 12, color: COLORS.dust, spread: Math.PI * 2 },
      wood: { speed: 220, life: 0.7, size: 9, color: COLORS.wood, spread: Math.PI * 2 },
      stone: { speed: 200, life: 0.8, size: 10, color: COLORS.stone, spread: Math.PI * 2 },
      mote: { speed: 9, life: 3.2, size: 5, color: 0xfde68a, spread: Math.PI * 2 },
    };
    const textureKey = kind === 'wood' ? 'debrisWood' : kind === 'stone' ? 'debrisStone' : kind === 'dust' ? 'smoke' : kind === 'mote' ? 'glow' : kind;
    this.particles.burst(p.x, p.y, { ...presets[kind], count, angle, texture: this.assets?.fx(textureKey) ?? null });
  }

  drawPreview(preview: DisclosedPreview | null, heroRadius: number, marker: MarkerState): void {
    const g = this.preview;
    const c = this.camera;
    g.clear();
    if (!preview) return;
    if (preview.segment.length >= 2) {
      const first = toScreen(c, preview.segment[0]!.x, preview.segment[0]!.y);
      g.moveTo(first.x, first.y);
      for (const point of preview.segment.slice(1)) {
        const p = toScreen(c, point.x, point.y);
        g.lineTo(p.x, p.y);
      }
      g.stroke({ width: 3, color: COLORS.preview, alpha: 0.8 });
    }
    const stop = toScreen(c, preview.stop.x, preview.stop.y);
    const color = marker === 'danger' ? COLORS.stopDanger : marker === 'uncertain' ? COLORS.stopUncertain : COLORS.stopSafe;
    if (preview.uncertain) {
      g.circle(stop.x, stop.y, preview.haloRadius * c.scale).fill({ color, alpha: 0.12 }).stroke({ width: 1, color, alpha: 0.5 });
    }
    g.circle(stop.x, stop.y, heroRadius * c.scale).stroke({ width: 3, color, alpha: 0.95 });
    if (marker === 'danger') {
      const r = heroRadius * c.scale * 0.6;
      g.moveTo(stop.x - r, stop.y - r).lineTo(stop.x + r, stop.y + r).stroke({ width: 3, color });
      g.moveTo(stop.x + r, stop.y - r).lineTo(stop.x - r, stop.y + r).stroke({ width: 3, color });
    }
  }

  drawTrail(points: readonly Vec2[] | null): void {
    const g = this.trail;
    const c = this.camera;
    g.clear();
    if (!points || points.length < 2) return;
    const spacing = 10;
    let carry = 0;
    for (let i = 1; i < points.length; i++) {
      const a = toScreen(c, points[i - 1]!.x, points[i - 1]!.y);
      const b = toScreen(c, points[i]!.x, points[i]!.y);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      let d = carry;
      while (d <= len) {
        g.circle(a.x + (dx / len) * d, a.y + (dy / len) * d, 2).fill({ color: COLORS.trail, alpha: 0.7 });
        d += spacing;
      }
      carry = d - len;
    }
  }

  drawAimIndicator(aim: AimState | null): void {
    const g = this.aimIndicator;
    g.clear();
    if (!aim || !aim.active) return;
    const { deadZone, maxRadius } = this.gestureConfig;
    g.circle(aim.originX, aim.originY, deadZone).stroke({ width: 1, color: COLORS.aim, alpha: 0.5 });
    g.circle(aim.originX, aim.originY, maxRadius).stroke({ width: 1, color: COLORS.aim, alpha: 0.2 });
    if (!aim.armed) return;
    const reach = deadZone + aim.power * (maxRadius - deadZone);
    const hx = aim.originX - aim.dirX * reach;
    const hy = aim.originY - aim.dirY * reach;
    g.moveTo(aim.originX, aim.originY).lineTo(hx, hy).stroke({ width: 4, color: COLORS.aim, alpha: 0.9 });
    g.circle(hx, hy, 8).fill({ color: COLORS.aim, alpha: 0.9 });
  }

  drawHud(state: HudState): void {
    const insets = safeInsets();
    this.hud.update(state, this.app.screen.width, this.app.screen.height, insets.top, insets.bottom);
  }

  drawOverlay(spec: OverlaySpec | null): void {
    this.overlay.show(spec, this.app.screen.width, this.app.screen.height);
  }

  private fillZone(g: Graphics, zone: Zone, fill: number, fillAlpha: number, stroke: number, strokeAlpha: number): void {
    const c = this.camera;
    if (zone.kind === 'disc') {
      const p = toScreen(c, zone.x, zone.y);
      g.circle(p.x, p.y, zone.r * c.scale).fill({ color: fill, alpha: fillAlpha }).stroke({ width: 2, color: stroke, alpha: strokeAlpha });
      return;
    }
    const pts: number[] = [];
    for (const point of zone.points) {
      const p = toScreen(c, point.x, point.y);
      pts.push(p.x, p.y);
    }
    g.poly(pts).fill({ color: fill, alpha: fillAlpha }).stroke({ width: 2, color: stroke, alpha: strokeAlpha });
  }

  private drawArrow(g: Graphics, zone: Zone, dirX: number, dirY: number): void {
    const c = this.camera;
    const box = zoneBounds(zone);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const len = 0.35;
    const tip = toScreen(c, cx + dirX * len, cy + dirY * len);
    const base = toScreen(c, cx - dirX * len, cy - dirY * len);
    const nx = -dirY * 0.25;
    const ny = dirX * 0.25;
    const l = toScreen(c, cx - dirX * len * 0.2 + nx, cy - dirY * len * 0.2 + ny);
    const r = toScreen(c, cx - dirX * len * 0.2 - nx, cy - dirY * len * 0.2 - ny);
    g.moveTo(base.x, base.y).lineTo(tip.x, tip.y).stroke({ width: 3, color: COLORS.spring });
    g.poly([tip.x, tip.y, l.x, l.y, r.x, r.y]).fill(COLORS.spring);
  }
}

/** Boîte englobante d'une zone, en unités d'arène. */
export function zoneBounds(zone: Zone): { x: number; y: number; width: number; height: number } {
  if (zone.kind === 'disc') return { x: zone.x - zone.r, y: zone.y - zone.r, width: zone.r * 2, height: zone.r * 2 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of zone.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
