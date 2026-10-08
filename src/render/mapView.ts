/**
 * Carte d'un acte, dessinée en PixiJS : bandeau (acte, cœurs, plumes, charmes),
 * sept étages de bas en haut sur trois colonnes, chemins, nœuds en disques de
 * couleur avec un pictogramme dessiné au Graphics, légende, bouton Retour en
 * lecture seule. Panneaux et polices du pack quand ils existent, formes et
 * police système sinon, comme `OverlayView`. Les coordonnées sont celles de
 * l'écran : `root` se place en (0, 0).
 */
import { Container, Graphics, NineSliceSprite, Sprite, Text, type Texture } from 'pixi.js';
import { MAX_CHARMS } from '../run/charms';
import type { ActMap, MapNode, NodeType } from '../run/map';
import type { AssetBundle } from './assets';
import { HUD_COLORS, type ScreenRect } from './hudView';

export interface MapSpec {
  map: ActMap;
  /** Nœud où se trouve Dodu, ou null avant le premier choix de l'acte. */
  current: string | null;
  visited: readonly string[];
  /** Nœuds que le joueur peut choisir maintenant. */
  reachable: readonly string[];
  actName: string;
  hp: number;
  maxHp: number;
  plumes: number;
  /** Charmes tenus : seul leur nombre est affiché. */
  charms: readonly string[];
  /** Consultation depuis la pause : rien ne se choisit, un bouton Retour s'affiche. */
  readOnly: boolean;
}

const SYSTEM_FONT = 'system-ui, sans-serif';

/** Clés d'icônes de nœuds dans le manifeste d'assets. */
const NODE_ICON_KEYS: Record<NodeType, string> = {
  combat: 'nodeCombat',
  elite: 'nodeElite',
  evenement: 'nodeEvent',
  marchand: 'nodeShop',
  repos: 'nodeRest',
  tresor: 'nodeTreasure',
  boss: 'nodeBoss',
};

const TYPE_COLORS: Record<NodeType, number> = {
  combat: 0xc0392b,
  elite: 0x7e3fb2,
  evenement: 0x2b7bb9,
  marchand: 0xe0a21b,
  repos: 0x2f9e5a,
  tresor: 0x8d6e3f,
  boss: 0x5b1212,
};

const ICON_COLORS: Record<NodeType, number> = {
  combat: 0xf8f1e0,
  elite: 0xf8f1e0,
  evenement: 0xf8f1e0,
  marchand: 0x3b2a1a,
  repos: 0xf8f1e0,
  tresor: 0xf8f1e0,
  boss: 0xf8f1e0,
};

const TYPE_LABELS: Record<NodeType, string> = {
  combat: 'Combat',
  elite: 'Élite',
  evenement: 'Événement',
  marchand: 'Marchand',
  repos: 'Repos',
  tresor: 'Trésor',
  boss: 'Boss',
};

const LEGEND_ROWS: ReadonlyArray<readonly NodeType[]> = [
  ['combat', 'elite', 'evenement', 'marchand'],
  ['repos', 'tresor', 'boss'],
];

const BANNER_HEIGHT = 80;
/** Marge intérieure du bandeau : le cadre du pack mord sur les côtés. */
const BANNER_PAD = 32;
const LEGEND_HEIGHT = 44;
const BACK_HEIGHT = 56;
const HINT_HEIGHT = 20;
const PULSE_SPEED = 5;

function blend(a: number, b: number, t: number): number {
  const ch = (shift: number): number => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t) & 255;
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

function inRect(x: number, y: number, r: ScreenRect): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

function slice(texture: Texture, width: number, height: number): NineSliceSprite {
  const s = Math.floor(Math.min(texture.width, texture.height) / 4);
  const sprite = new NineSliceSprite({ texture, leftWidth: s, topHeight: s, rightWidth: s, bottomHeight: s });
  sprite.width = width;
  sprite.height = height;
  return sprite;
}

/**
 * Pictogramme d'un type de nœud, centré sur l'origine, dont le rayon utile
 * vaut `u`. `cutout` est la couleur du disque, pour les évidements.
 */
function drawIcon(g: Graphics, type: NodeType, u: number, color: number, cutout: number): void {
  switch (type) {
    case 'combat': {
      g.moveTo(-0.16 * u, 0.16 * u).lineTo(0.46 * u, -0.46 * u).stroke({ width: 0.2 * u, color, cap: 'round' });
      g.moveTo(-0.42 * u, -0.12 * u).lineTo(0.12 * u, 0.42 * u).stroke({ width: 0.15 * u, color, cap: 'round' });
      g.moveTo(-0.16 * u, 0.16 * u).lineTo(-0.44 * u, 0.44 * u).stroke({ width: 0.16 * u, color, cap: 'round' });
      break;
    }
    case 'elite': {
      const pts = [-0.5, 0.34, -0.5, -0.26, -0.22, 0.04, 0, -0.38, 0.22, 0.04, 0.5, -0.26, 0.5, 0.34];
      g.poly(pts.map((v) => v * u)).fill(color);
      for (const [x, y] of [[-0.5, -0.3], [0, -0.42], [0.5, -0.3]] as const) g.circle(x * u, y * u, 0.08 * u).fill(color);
      g.moveTo(-0.5 * u, 0.2 * u).lineTo(0.5 * u, 0.2 * u).stroke({ width: 0.07 * u, color: cutout });
      break;
    }
    case 'evenement': {
      g.arc(0, -0.17 * u, 0.3 * u, Math.PI, Math.PI * 2.5).lineTo(0, 0.2 * u).stroke({ width: 0.17 * u, color, cap: 'round', join: 'round' });
      g.circle(0, 0.47 * u, 0.09 * u).fill(color);
      break;
    }
    case 'marchand': {
      g.circle(0, 0, 0.46 * u).stroke({ width: 0.1 * u, color });
      g.arc(0, -0.13 * u, 0.13 * u, -0.25 * Math.PI, -1.5 * Math.PI, true)
        .arc(0, 0.13 * u, 0.13 * u, -0.5 * Math.PI, 0.75 * Math.PI)
        .stroke({ width: 0.09 * u, color, cap: 'round', join: 'round' });
      g.moveTo(0, -0.34 * u).lineTo(0, 0.34 * u).stroke({ width: 0.06 * u, color, cap: 'round' });
      break;
    }
    case 'repos': {
      flame(g, u, 1, 0, color);
      flame(g, u, 0.48, 0.2 * u, cutout);
      break;
    }
    case 'tresor': {
      g.moveTo(-0.46 * u, 0)
        .lineTo(-0.46 * u, -0.18 * u)
        .quadraticCurveTo(-0.46 * u, -0.42 * u, 0, -0.42 * u)
        .quadraticCurveTo(0.46 * u, -0.42 * u, 0.46 * u, -0.18 * u)
        .lineTo(0.46 * u, 0)
        .closePath()
        .fill(color);
      g.roundRect(-0.46 * u, 0.04 * u, 0.92 * u, 0.4 * u, 0.06 * u).fill(color);
      g.rect(-0.08 * u, -0.1 * u, 0.16 * u, 0.22 * u).fill(cutout);
      break;
    }
    case 'boss': {
      g.circle(0, -0.1 * u, 0.4 * u).fill(color);
      g.roundRect(-0.22 * u, 0.12 * u, 0.44 * u, 0.32 * u, 0.08 * u).fill(color);
      g.circle(-0.16 * u, -0.08 * u, 0.11 * u).fill(cutout);
      g.circle(0.16 * u, -0.08 * u, 0.11 * u).fill(cutout);
      g.poly([0, 0.08 * u, -0.06 * u, 0.22 * u, 0.06 * u, 0.22 * u]).fill(cutout);
      for (const x of [-0.08, 0.08]) g.moveTo(x * u, 0.3 * u).lineTo(x * u, 0.44 * u).stroke({ width: 0.04 * u, color: cutout });
      break;
    }
  }
}

function flame(g: Graphics, u: number, k: number, dy: number, color: number): void {
  const p = (x: number, y: number): [number, number] => [x * k * u, y * k * u + dy];
  g.moveTo(...p(0.04, -0.55))
    .bezierCurveTo(...p(0.12, -0.3), ...p(0.42, -0.12), ...p(0.38, 0.18))
    .bezierCurveTo(...p(0.35, 0.42), ...p(0.18, 0.52), ...p(0, 0.52))
    .bezierCurveTo(...p(-0.18, 0.52), ...p(-0.38, 0.42), ...p(-0.38, 0.16))
    .bezierCurveTo(...p(-0.38, -0.04), ...p(-0.22, -0.14), ...p(-0.18, -0.34))
    .bezierCurveTo(...p(-0.08, -0.22), ...p(-0.02, -0.4), ...p(0.04, -0.55))
    .closePath()
    .fill(color);
}

interface PlacedNode {
  node: MapNode;
  x: number;
  y: number;
  radius: number;
}

export class MapView {
  readonly root = new Container();
  private spec: MapSpec | null = null;
  private width = 390;
  private height = 844;
  private safeTop = 0;
  private safeBottom = 0;
  private time = 0;
  private hits: Array<{ id: string; x: number; y: number; radius: number }> = [];
  private pulsing: Array<{ body: Container; halo: Graphics }> = [];
  private backRect: ScreenRect | null = null;

  constructor(private readonly assets: AssetBundle | null) {
    this.root.visible = false;
  }

  get visible(): boolean {
    return this.root.visible;
  }

  show(spec: MapSpec): void {
    this.spec = spec;
    this.root.visible = true;
    this.rebuild();
  }

  hide(): void {
    this.root.visible = false;
    this.clear();
    this.spec = null;
  }

  layout(width: number, height: number, safeTop: number, safeBottom: number): void {
    this.width = width;
    this.height = height;
    this.safeTop = safeTop;
    this.safeBottom = safeBottom;
    if (this.spec && this.root.visible) this.rebuild();
  }

  /** `dt` en secondes : fait pulser les nœuds atteignables. */
  update(dt: number): void {
    if (!this.root.visible || this.pulsing.length === 0) return;
    this.time += dt;
    const wave = Math.sin(this.time * PULSE_SPEED);
    for (const p of this.pulsing) {
      p.body.scale.set(1 + 0.07 * wave);
      p.halo.alpha = 0.6 + 0.4 * wave;
    }
  }

  /** `node:<id>` pour un nœud atteignable, `back-pause` pour Retour, sinon null. */
  hitTest(x: number, y: number): string | null {
    if (!this.root.visible || !this.spec) return null;
    if (this.backRect && inRect(x, y, this.backRect)) return 'back-pause';
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const h of this.hits) {
      const d = Math.hypot(x - h.x, y - h.y);
      if (d <= h.radius && d < bestDistance) {
        best = `node:${h.id}`;
        bestDistance = d;
      }
    }
    return best;
  }

  private clear(): void {
    for (const child of this.root.removeChildren()) child.destroy({ children: true });
    this.hits = [];
    this.pulsing = [];
    this.backRect = null;
  }

  private rebuild(): void {
    this.clear();
    const spec = this.spec;
    if (!spec) return;
    const w = this.width;
    const h = this.height;
    const titleFont = this.assets?.fontFamily('title', SYSTEM_FONT) ?? SYSTEM_FONT;
    const textFont = this.assets?.fontFamily('text', SYSTEM_FONT) ?? SYSTEM_FONT;
    const panelTexture = this.assets?.ui('panel') ?? null;
    const buttonTexture = this.assets?.ui('button') ?? null;
    const onBanner = buttonTexture ? HUD_COLORS.ink : HUD_COLORS.text;
    const onButton = buttonTexture ? HUD_COLORS.ink : HUD_COLORS.text;
    const text = (value: string, size: number, fill: number, family: string, weight: '400' | '600' | '700'): Text =>
      new Text({ text: value, style: { fill, fontSize: size, fontFamily: family, fontWeight: weight } });

    this.root.addChild(new Graphics().rect(0, 0, w, h).fill(0x14161b));

    // Bandeau : acte, plumes, cœurs, charmes.
    const bannerY = this.safeTop + 8;
    const banner = buttonTexture
      ? slice(buttonTexture, w - 16, BANNER_HEIGHT)
      : new Graphics().roundRect(0, 0, w - 16, BANNER_HEIGHT, 14).fill(HUD_COLORS.button).stroke({ width: 2, color: HUD_COLORS.buttonEdge });
    banner.x = 8;
    banner.y = bannerY;
    this.root.addChild(banner);

    const act = text(spec.actName, 18, onBanner, titleFont, '400');
    act.x = BANNER_PAD;
    act.y = bannerY + 17;
    const plumes = text(`${spec.plumes} plume${spec.plumes > 1 ? 's' : ''}`, 14, onBanner, textFont, '700');
    plumes.x = w - BANNER_PAD - plumes.width;
    plumes.y = bannerY + 19;
    const coin = new Graphics().circle(0, 0, 8).fill(0xe0a21b).stroke({ width: 2, color: 0x8a5a0a }).circle(0, 0, 3).fill(0x8a5a0a);
    coin.x = plumes.x - 14;
    coin.y = plumes.y + plumes.height / 2;
    const room = plumes.x - 26 - BANNER_PAD;
    if (act.width > room) act.scale.set(Math.max(0.5, room / act.width));
    const charms = text(`Charmes ${spec.charms.length}/${MAX_CHARMS}`, 13, onBanner, textFont, '700');
    charms.x = w - BANNER_PAD - charms.width;
    charms.y = bannerY + 53 - charms.height / 2;
    this.root.addChild(act, coin, plumes, charms);
    for (let i = 0; i < spec.maxHp; i++) {
      const heart = this.heart(i < spec.hp);
      heart.x = BANNER_PAD + 11 + i * 26;
      heart.y = bannerY + 53;
      this.root.addChild(heart);
    }

    // Zones : carte, puis légende, puis pied de page.
    const bottom = h - this.safeBottom - 10;
    const footerHeight = spec.readOnly ? BACK_HEIGHT : HINT_HEIGHT;
    const legendTop = bottom - footerHeight - 6 - LEGEND_HEIGHT;
    const mapRect: ScreenRect = { x: 8, y: bannerY + BANNER_HEIGHT + 8, width: w - 16, height: legendTop - 8 - (bannerY + BANNER_HEIGHT + 8) };
    const mapPanel = panelTexture
      ? slice(panelTexture, mapRect.width, mapRect.height)
      : new Graphics().roundRect(0, 0, mapRect.width, mapRect.height, 18).fill(0x1f2229).stroke({ width: 2, color: HUD_COLORS.buttonEdge });
    mapPanel.x = mapRect.x;
    mapPanel.y = mapRect.y;
    this.root.addChild(mapPanel);

    this.drawMap(spec, mapRect, panelTexture !== null);
    this.drawLegend(legendTop, textFont);

    if (spec.readOnly) {
      const width = Math.min(260, w - 32);
      const rect: ScreenRect = { x: w / 2 - width / 2, y: bottom - BACK_HEIGHT, width, height: BACK_HEIGHT };
      const bg = buttonTexture
        ? slice(buttonTexture, rect.width, rect.height)
        : new Graphics().roundRect(0, 0, rect.width, rect.height, 16).fill(HUD_COLORS.button).stroke({ width: 2, color: HUD_COLORS.buttonEdge });
      bg.x = rect.x;
      bg.y = rect.y;
      const label = text('Retour', 18, onButton, titleFont, '400');
      label.x = rect.x + rect.width / 2 - label.width / 2;
      label.y = rect.y + rect.height / 2 - label.height / 2;
      this.root.addChild(bg, label);
      this.backRect = rect;
    } else if (spec.reachable.length > 0) {
      const hint = text(spec.current === null ? 'Choisissez votre première salle.' : 'Choisissez la prochaine salle.', 13, HUD_COLORS.text, textFont, '600');
      hint.x = w / 2 - hint.width / 2;
      hint.y = bottom - footerHeight / 2 - hint.height / 2;
      this.root.addChild(hint);
    }
  }

  private heart(full: boolean): Sprite | Graphics {
    const texture = this.assets?.ui(full ? 'heartFull' : 'heartEmpty') ?? null;
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.scale.set(22 / Math.max(texture.width, texture.height));
      return sprite;
    }
    const color = full ? HUD_COLORS.heart : HUD_COLORS.dim;
    return new Graphics().circle(-4, -3, 6).fill(color).circle(4, -3, 6).fill(color).poly([-10, -1, 10, -1, 0, 10]).fill(color);
  }

  private drawMap(spec: MapSpec, rect: ScreenRect, parchment: boolean): void {
    const { map } = spec;
    const frame = parchment ? 34 : 10;
    const inner: ScreenRect = { x: rect.x + frame, y: rect.y + frame, width: rect.width - 2 * frame, height: rect.height - 2 * frame };
    const floors = Math.max(2, map.floors);
    const columns = Math.max(1, map.columns);
    const gap = (inner.height - 2 * 34) / (floors - 1);
    const baseRadius = Math.max(16, Math.min(25, gap * 0.36));
    const bossRadius = baseRadius * 1.3;
    const bottomY = inner.y + inner.height - baseRadius - 8;
    const topY = inner.y + bossRadius + 6;
    const step = (bottomY - topY) / (floors - 1);

    const placed = new Map<string, PlacedNode>();
    for (const node of map.nodes) {
      placed.set(node.id, {
        node,
        x: inner.x + (inner.width * (node.column + 0.5)) / columns,
        y: bottomY - (node.floor - 1) * step,
        radius: node.type === 'boss' ? bossRadius : baseRadius,
      });
    }

    const visited = new Set(spec.visited);
    const reachable = new Set(spec.readOnly ? [] : spec.reachable);

    // Chemins : parcouru, ouvert depuis le nœud courant, ou simple trait.
    const palette = parchment
      ? { taken: 0x7a4a14, open: 0x3b2a1a, idle: 0x9c8566 }
      : { taken: 0xfbbf24, open: 0xf3e9d2, idle: 0x5b616c };
    const paths = new Graphics();
    const draw = (from: PlacedNode, to: PlacedNode, width: number, color: number, alpha: number): void => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      paths
        .moveTo(from.x + ux * (from.radius + 2), from.y + uy * (from.radius + 2))
        .lineTo(to.x - ux * (to.radius + 2), to.y - uy * (to.radius + 2))
        .stroke({ width, color, alpha, cap: 'round' });
    };
    const edges: Array<{ from: PlacedNode; to: PlacedNode; kind: 'idle' | 'open' | 'taken' }> = [];
    for (const from of placed.values()) {
      for (const id of from.node.next) {
        const to = placed.get(id);
        if (!to) continue;
        const kind = visited.has(from.node.id) && visited.has(id) ? 'taken' : from.node.id === spec.current && reachable.has(id) ? 'open' : 'idle';
        edges.push({ from, to, kind });
      }
    }
    for (const e of edges) if (e.kind === 'idle') draw(e.from, e.to, 3, palette.idle, 0.75);
    for (const e of edges) if (e.kind === 'open') draw(e.from, e.to, 4, palette.open, 1);
    for (const e of edges) if (e.kind === 'taken') draw(e.from, e.to, 5, palette.taken, 1);
    this.root.addChild(paths);

    // Nœuds : visités assombris, courant cerclé, atteignables pulsants, autres grisés.
    const grey = parchment ? 0xa89a82 : 0x4b4f58;
    const outline = parchment ? 0x3b2a1a : 0x0b0c0f;
    const accent = parchment ? 0xd97706 : 0xfbbf24;
    const order = [...placed.values()].sort((a, b) => a.y - b.y);
    for (const p of order) {
      const { node } = p;
      const isCurrent = node.id === spec.current;
      const isVisited = visited.has(node.id);
      const isReachable = reachable.has(node.id);
      const base = TYPE_COLORS[node.type];
      const fill = isReachable || isCurrent ? base : isVisited ? blend(base, 0x0b0c0f, 0.55) : blend(base, grey, 0.78);
      const iconColor = isReachable || isCurrent ? ICON_COLORS[node.type] : blend(ICON_COLORS[node.type], fill, isVisited ? 0.35 : 0.3);

      const body = new Container();
      body.x = p.x;
      body.y = p.y;
      const disc = new Graphics().circle(0, 0, p.radius).fill(fill).stroke({ width: node.type === 'boss' ? 4 : 3, color: node.type === 'boss' ? 0xe0a21b : outline });
      // Icône du pack quand elle existe, pictogramme dessiné sinon.
      const texture = this.assets?.ui(NODE_ICON_KEYS[node.type]) ?? null;
      let icon: Graphics | Sprite;
      if (texture) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.tint = iconColor;
        const s = (p.radius * 1.25) / Math.max(texture.width, texture.height);
        sprite.scale.set(s);
        icon = sprite;
      } else {
        icon = new Graphics();
        drawIcon(icon, node.type, p.radius * 0.92, iconColor, fill);
      }
      body.addChild(disc, icon);

      if (isCurrent) {
        const r = p.radius;
        const ring = new Graphics().circle(0, 0, r + 5).stroke({ width: 3.5, color: accent });
        const pointer = new Graphics().poly([-(r + 18), -9, -(r + 18), 9, -(r + 7), 0]).fill(accent).stroke({ width: 2, color: outline, join: 'round' });
        body.addChild(ring, pointer);
      }
      if (isVisited && !isCurrent) {
        const badge = new Graphics()
          .circle(0, 0, 8)
          .fill(0x14161b)
          .stroke({ width: 1.5, color: 0xf3e9d2, alpha: 0.9 })
          .moveTo(-3.5, 0.5)
          .lineTo(-1, 3)
          .lineTo(4, -3)
          .stroke({ width: 2, color: 0xf3e9d2, cap: 'round', join: 'round' });
        badge.x = p.radius * 0.8;
        badge.y = -p.radius * 0.8;
        body.addChild(badge);
      }
      if (isReachable) {
        const halo = new Graphics().circle(0, 0, p.radius + 7).stroke({ width: 3, color: accent });
        body.addChild(halo);
        this.pulsing.push({ body, halo });
        this.hits.push({ id: node.id, x: p.x, y: p.y, radius: p.radius + 14 });
      }
      this.root.addChild(body);
    }
  }

  private drawLegend(top: number, textFont: string): void {
    const available = this.width - 32;
    LEGEND_ROWS.forEach((row, rowIndex) => {
      const y = top + rowIndex * (LEGEND_HEIGHT / 2) + LEGEND_HEIGHT / 4;
      let labels: Text[] = [];
      let widths: number[] = [];
      let free = 0;
      for (const size of [12, 11, 10]) {
        labels = row.map((type) => new Text({ text: TYPE_LABELS[type], style: { fill: HUD_COLORS.text, fontSize: size, fontFamily: textFont, fontWeight: '600' } }));
        widths = labels.map((l) => 20 + 6 + l.width);
        free = available - widths.reduce((acc, v) => acc + v, 0);
        if (free >= 6 * (row.length - 1)) break;
      }
      const gap = Math.max(6, Math.min(24, free / Math.max(1, row.length - 1)));
      let x = 16 + Math.max(0, (free - gap * (row.length - 1)) / 2);
      row.forEach((type, i) => {
        const mini = new Graphics().circle(0, 0, 10).fill(TYPE_COLORS[type]).stroke({ width: 1.5, color: 0x0b0c0f });
        drawIcon(mini, type, 9, ICON_COLORS[type], TYPE_COLORS[type]);
        mini.x = x + 10;
        mini.y = y;
        const label = labels[i]!;
        label.x = x + 26;
        label.y = y - label.height / 2;
        this.root.addChild(mini, label);
        x += widths[i]! + gap;
      });
    });
  }
}
