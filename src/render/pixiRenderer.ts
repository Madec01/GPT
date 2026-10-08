/**
 * Rendu PixiJS en formes simples. Aucune règle de jeu ici : le renderer lit
 * le monde ECS et dessine. Couches, du fond vers l'avant : sol et décor
 * statique, zones au sol, trace fantôme, corps mobiles, aperçu de visée ;
 * puis, en pixels d'écran, l'interface, l'indicateur de geste et les écrans
 * de transition.
 */
import { Application, Container, Graphics, Text } from 'pixi.js';
import type { Entity, World } from '../core/ecs/world';
import type { Vec2 } from '../core/math/vec2';
import { BoxShape, CircleBody, Transform } from '../core/physics';
import type { AimState } from '../input/gesture';
import { DEFAULT_GESTURE, type GestureConfig } from '../input/gesture';
import { Breakable, Enemy, Hazard, Health, Kind, Pickup, Springboard } from '../sim/components';
import type { Zone } from '../sim/zones';
import { DEFAULT_MARGINS, fitArena, toScreen, type Camera, type Margins } from './camera';
import type { DisclosedPreview } from './disclosure';

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
  preview: 0xf9fafb,
  stopSafe: 0x22c55e,
  stopUncertain: 0xf59e0b,
  stopDanger: 0xef4444,
  trail: 0x93c5fd,
  aim: 0xfde68a,
  hud: 0xe5e7eb,
  hudDim: 0x6b7280,
  charge: 0xfbbf24,
  overlay: 0x000000,
  button: 0x374151,
  buttonEdge: 0x9ca3af,
  stun: 0xfde047,
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

const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HudState {
  hp: number;
  maxHp: number;
  roomName: string;
  turn: number;
  objective: string;
  brakeAvailable: boolean;
  brakeActive: boolean;
  charge: number;
  chargeMax: number;
  form: string;
  /** Côté du frein : `left` ou `right`. */
  brakeSide: 'left' | 'right';
}

export interface OverlayButton {
  id: string;
  label: string;
}

export interface OverlaySpec {
  title: string;
  lines: string[];
  buttons: OverlayButton[];
}

export interface ZoneDrawing {
  zones: Zone[];
  stunned: boolean;
}

export type MarkerState = 'safe' | 'uncertain' | 'danger';

/**
 * Marges d'interface augmentées des zones sûres de l'appareil (encoche,
 * barre de geste), lues depuis les variables CSS définies dans index.html.
 */
function safeMargins(): Margins {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): number => Number.parseFloat(style.getPropertyValue(name)) || 0;
  return {
    top: DEFAULT_MARGINS.top + read('--safe-top'),
    bottom: DEFAULT_MARGINS.bottom + read('--safe-bottom'),
    side: DEFAULT_MARGINS.side,
  };
}

function inRect(x: number, y: number, r: ScreenRect): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

export class PixiRenderer {
  camera: Camera;
  private margins: Margins;
  private readonly arena = new Container();
  private readonly statics = new Graphics();
  private readonly zones = new Graphics();
  private readonly trail = new Graphics();
  private readonly dynamics = new Graphics();
  private readonly preview = new Graphics();
  private readonly hud = new Graphics();
  private readonly hudTexts = {
    room: new Text({ text: '', style: { fill: COLORS.hud, fontSize: 15, fontFamily: FONT, fontWeight: '600' } }),
    objective: new Text({ text: '', style: { fill: COLORS.hudDim, fontSize: 13, fontFamily: FONT } }),
    brake: new Text({ text: 'FREIN', style: { fill: COLORS.hud, fontSize: 14, fontFamily: FONT, fontWeight: '700' } }),
    power: new Text({ text: '', style: { fill: COLORS.hud, fontSize: 12, fontFamily: FONT, fontWeight: '600', align: 'center' } }),
  };
  private readonly aimIndicator = new Graphics();
  private readonly overlay = new Container();
  private overlayButtons: Array<{ id: string; rect: ScreenRect }> = [];
  private brakeRect: ScreenRect = { x: 0, y: 0, width: 0, height: 0 };

  private constructor(
    readonly app: Application,
    arenaWidth: number,
    arenaHeight: number,
    private readonly gestureConfig: GestureConfig,
  ) {
    this.margins = safeMargins();
    this.camera = fitArena(app.screen.width, app.screen.height, arenaWidth, arenaHeight, this.margins);
    this.arena.addChild(this.statics, this.zones, this.trail, this.dynamics, this.preview);
    this.hud.addChild(this.hudTexts.room, this.hudTexts.objective, this.hudTexts.brake, this.hudTexts.power);
    this.overlay.visible = false;
    app.stage.addChild(this.arena, this.hud, this.aimIndicator, this.overlay);
  }

  static async create(
    parent: HTMLElement,
    arenaWidth: number,
    arenaHeight: number,
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
    const renderer = new PixiRenderer(app, arenaWidth, arenaHeight, gestureConfig);
    app.renderer.on('resize', () => renderer.onResize());
    return renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /** Change d'arène, par exemple en entrant dans une nouvelle salle. */
  setArena(arenaWidth: number, arenaHeight: number): void {
    this.camera = fitArena(this.app.screen.width, this.app.screen.height, arenaWidth, arenaHeight, this.margins);
  }

  private onResize(): void {
    this.margins = safeMargins();
    this.setArena(this.camera.arenaWidth, this.camera.arenaHeight);
  }

  /** Zone du bouton de frein, en pixels d'écran. */
  hitBrake(x: number, y: number): boolean {
    return inRect(x, y, this.brakeRect);
  }

  /** Identifiant du bouton d'écran de transition touché, ou `null`. */
  hitOverlayButton(x: number, y: number): string | null {
    for (const b of this.overlayButtons) if (inRect(x, y, b.rect)) return b.id;
    return null;
  }

  drawStatics(world: World): void {
    const g = this.statics;
    const c = this.camera;
    g.clear();
    const origin = toScreen(c, 0, 0);
    g.rect(origin.x, origin.y, c.arenaWidth * c.scale, c.arenaHeight * c.scale)
      .fill(COLORS.floor)
      .stroke({ width: 3, color: COLORS.wall });

    for (const entity of world.query(Hazard)) {
      this.fillZone(g, world.require(entity, Hazard).zone, COLORS.pit, 1, COLORS.wall, 0.6);
    }
    for (const entity of world.query(Springboard)) {
      const s = world.require(entity, Springboard);
      this.fillZone(g, s.zone, COLORS.spring, 0.25, COLORS.spring, 0.9);
      this.drawArrow(g, s.zone, s.dirX, s.dirY);
    }
    for (const entity of world.query(Transform, BoxShape)) {
      const t = world.require(entity, Transform);
      const box = world.require(entity, BoxShape);
      const kind = world.get(entity, Breakable)?.breakableKind;
      const fill = kind === 'crate' ? COLORS.crate : kind === 'barricade' ? COLORS.barricade : kind === 'column' ? COLORS.column : COLORS.box;
      const p = toScreen(c, t.x - box.halfWidth, t.y - box.halfHeight);
      g.rect(p.x, p.y, box.halfWidth * 2 * c.scale, box.halfHeight * 2 * c.scale)
        .fill(fill)
        .stroke({ width: 2, color: COLORS.boxEdge });
    }
    for (const entity of world.query(Pickup)) {
      const p = world.require(entity, Pickup);
      const s = toScreen(c, p.x, p.y);
      g.circle(s.x, s.y, p.r * c.scale).fill(COLORS.heart).stroke({ width: 2, color: COLORS.edge });
    }
  }

  /** Cible d'un objectif "pousser". */
  drawGoal(goal: Zone | null): void {
    if (!goal) return;
    this.fillZone(this.statics, goal, COLORS.goal, 0.12, COLORS.goal, 0.9);
  }

  drawZones(zones: readonly ZoneDrawing[]): void {
    const g = this.zones;
    g.clear();
    for (const { zones: list, stunned } of zones) {
      const color = stunned ? COLORS.zoneStunned : COLORS.zone;
      for (const zone of list) this.fillZone(g, zone, color, stunned ? 0.1 : 0.2, color, stunned ? 0.4 : 0.8);
    }
  }

  drawDynamics(world: World, hero: Entity): void {
    const g = this.dynamics;
    const c = this.camera;
    g.clear();
    for (const entity of world.query(Transform, CircleBody)) {
      const t = world.require(entity, Transform);
      const body = world.require(entity, CircleBody);
      const kind = world.get(entity, Kind)?.kind ?? 'dummy';
      const p = toScreen(c, t.x, t.y);
      const r = body.radius * c.scale;
      const isHero = entity === hero;
      g.circle(p.x, p.y, r)
        .fill(KIND_COLORS[kind] ?? COLORS.box)
        .stroke({ width: 2, color: isHero ? COLORS.heroEdge : COLORS.edge });
      if (isHero) {
        g.circle(p.x - r * 0.3, p.y - r * 0.2, r * 0.13).fill(COLORS.edge);
        g.circle(p.x + r * 0.3, p.y - r * 0.2, r * 0.13).fill(COLORS.edge);
      }
      const enemy = world.get(entity, Enemy);
      const health = world.get(entity, Health);
      if (enemy && health) {
        const pipWidth = 6;
        const total = health.max * (pipWidth + 2);
        for (let i = 0; i < health.max; i++) {
          const x = p.x - total / 2 + i * (pipWidth + 2);
          g.rect(x, p.y - r - 10, pipWidth, 4).fill(i < health.hp ? COLORS.hud : COLORS.hudDim);
        }
        if (enemy.stunned) {
          for (let i = 0; i < 3; i++) {
            g.circle(p.x - 10 + i * 10, p.y - r - 18, 2.5).fill(COLORS.stun);
          }
        }
      }
    }
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
    const g = this.hud;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const top = this.margins.top - DEFAULT_MARGINS.top;
    const bottom = this.margins.bottom - DEFAULT_MARGINS.bottom;
    g.clear();

    // Haut : cœurs, salle, objectif.
    for (let i = 0; i < state.maxHp; i++) {
      const x = 18 + i * 22;
      const y = top + 22;
      const alive = i < state.hp;
      g.circle(x - 4, y - 3, 6).fill(alive ? COLORS.heart : COLORS.hudDim);
      g.circle(x + 4, y - 3, 6).fill(alive ? COLORS.heart : COLORS.hudDim);
      g.poly([x - 10, y - 1, x + 10, y - 1, x, y + 10]).fill(alive ? COLORS.heart : COLORS.hudDim);
    }
    this.hudTexts.room.text = `${state.roomName} · tour ${state.turn}`;
    this.hudTexts.room.x = w - this.hudTexts.room.width - 16;
    this.hudTexts.room.y = top + 10;
    this.hudTexts.objective.text = state.objective;
    this.hudTexts.objective.x = w - this.hudTexts.objective.width - 16;
    this.hudTexts.objective.y = top + 32;

    // Bas : frein d'un côté, pouvoir et jauge de l'autre.
    const size = 72;
    const y = h - bottom - size - 20;
    const brakeX = state.brakeSide === 'left' ? 18 : w - 18 - size;
    const powerX = state.brakeSide === 'left' ? w - 18 - size : 18;
    this.brakeRect = { x: brakeX, y, width: size, height: size };
    const brakeColor = state.brakeAvailable ? (state.brakeActive ? COLORS.hud : COLORS.button) : COLORS.background;
    g.roundRect(brakeX, y, size, size, 14)
      .fill(brakeColor)
      .stroke({ width: 2, color: state.brakeAvailable ? COLORS.buttonEdge : COLORS.hudDim });
    this.hudTexts.brake.style.fill = state.brakeAvailable ? (state.brakeActive ? COLORS.background : COLORS.hud) : COLORS.hudDim;
    this.hudTexts.brake.x = brakeX + size / 2 - this.hudTexts.brake.width / 2;
    this.hudTexts.brake.y = y + size / 2 - this.hudTexts.brake.height / 2;

    g.roundRect(powerX, y, size, size, 14).fill(COLORS.button).stroke({ width: 2, color: COLORS.buttonEdge });
    const hasPower = state.form !== 'none';
    this.hudTexts.power.text = hasPower ? state.form.toUpperCase() : 'SANS\nPOUVOIR';
    this.hudTexts.power.style.fill = hasPower ? COLORS.hud : COLORS.hudDim;
    this.hudTexts.power.style.fontSize = hasPower ? 13 : 10;
    this.hudTexts.power.x = powerX + size / 2 - this.hudTexts.power.width / 2;
    this.hudTexts.power.y = y + (hasPower ? 12 : 6);
    const segW = (size - 16 - (state.chargeMax - 1) * 4) / state.chargeMax;
    for (let i = 0; i < state.chargeMax; i++) {
      const x = powerX + 8 + i * (segW + 4);
      const filled = hasPower && i < state.charge;
      g.roundRect(x, y + size - 24, segW, 12, 3).fill(filled ? COLORS.charge : COLORS.background).stroke({ width: 1, color: COLORS.buttonEdge });
    }
  }

  /** Affiche un écran de transition par-dessus le jeu, ou le masque avec `null`. */
  drawOverlay(spec: OverlaySpec | null): void {
    const layer = this.overlay;
    for (const child of layer.removeChildren()) child.destroy({ children: true });
    this.overlayButtons = [];
    if (!spec) {
      layer.visible = false;
      return;
    }
    layer.visible = true;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const dim = new Graphics().rect(0, 0, w, h).fill({ color: COLORS.overlay, alpha: 0.72 });
    layer.addChild(dim);
    const title = new Text({ text: spec.title, style: { fill: COLORS.hud, fontSize: 28, fontFamily: FONT, fontWeight: '800', align: 'center', wordWrap: true, wordWrapWidth: w - 48 } });
    title.x = w / 2 - title.width / 2;
    title.y = h * 0.28;
    layer.addChild(title);
    let y = title.y + title.height + 16;
    for (const line of spec.lines) {
      const text = new Text({ text: line, style: { fill: COLORS.hud, fontSize: 16, fontFamily: FONT, align: 'center', wordWrap: true, wordWrapWidth: w - 64 } });
      text.x = w / 2 - text.width / 2;
      text.y = y;
      layer.addChild(text);
      y += text.height + 8;
    }
    y += 16;
    for (const button of spec.buttons) {
      const label = new Text({ text: button.label, style: { fill: COLORS.hud, fontSize: 17, fontFamily: FONT, fontWeight: '700', align: 'center', wordWrap: true, wordWrapWidth: w - 96 } });
      const height = Math.max(56, label.height + 24);
      const rect: ScreenRect = { x: 24, y, width: w - 48, height };
      const g = new Graphics().roundRect(rect.x, rect.y, rect.width, rect.height, 16).fill(COLORS.button).stroke({ width: 2, color: COLORS.buttonEdge });
      label.x = w / 2 - label.width / 2;
      label.y = y + height / 2 - label.height / 2;
      layer.addChild(g, label);
      this.overlayButtons.push({ id: button.id, rect });
      y += height + 12;
    }
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
    if (zone.kind !== 'poly') return;
    const c = this.camera;
    let cx = 0;
    let cy = 0;
    for (const p of zone.points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= zone.points.length;
    cy /= zone.points.length;
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
