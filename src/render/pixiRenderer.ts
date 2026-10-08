/**
 * Rendu PixiJS en formes grises. Aucune règle de jeu ici : le renderer lit le
 * monde ECS et dessine. Les couches, du fond vers l'avant : sol et décor
 * statique, trace fantôme, corps mobiles, aperçu de visée, indicateur de geste.
 */
import { Application, Container, Graphics } from 'pixi.js';
import type { Entity, World } from '../core/ecs/world';
import type { Vec2 } from '../core/math/vec2';
import { BoxShape, CircleBody, Transform } from '../core/physics';
import type { AimState } from '../input/gesture';
import { DEFAULT_GESTURE, type GestureConfig } from '../input/gesture';
import { fitArena, toScreen, type Camera } from './camera';
import type { DisclosedPreview } from './disclosure';

const COLORS = {
  background: 0x1b1d22,
  floor: 0x272a31,
  wall: 0x6b7280,
  box: 0x4b5563,
  boxEdge: 0x9ca3af,
  hero: 0xe5e7eb,
  heroEdge: 0x9ca3af,
  dummy: 0x8b93a1,
  dummyEdge: 0x5b616c,
  preview: 0xf9fafb,
  stopSafe: 0x22c55e,
  stopUncertain: 0xf59e0b,
  trail: 0x93c5fd,
  aim: 0xfde68a,
} as const;

export class PixiRenderer {
  camera: Camera;
  private readonly arena = new Container();
  private readonly statics = new Graphics();
  private readonly trail = new Graphics();
  private readonly dynamics = new Graphics();
  private readonly preview = new Graphics();
  private readonly aimIndicator = new Graphics();

  private constructor(
    readonly app: Application,
    arenaWidth: number,
    arenaHeight: number,
    private readonly gestureConfig: GestureConfig,
  ) {
    this.camera = fitArena(app.screen.width, app.screen.height, arenaWidth, arenaHeight);
    this.arena.addChild(this.statics, this.trail, this.dynamics, this.preview);
    app.stage.addChild(this.arena, this.aimIndicator);
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

  private onResize(): void {
    this.camera = fitArena(
      this.app.screen.width,
      this.app.screen.height,
      this.camera.arenaWidth,
      this.camera.arenaHeight,
    );
  }

  drawStatics(world: World): void {
    const g = this.statics;
    const c = this.camera;
    g.clear();
    const origin = toScreen(c, 0, 0);
    g.rect(origin.x, origin.y, c.arenaWidth * c.scale, c.arenaHeight * c.scale)
      .fill(COLORS.floor)
      .stroke({ width: 3, color: COLORS.wall });
    for (const entity of world.query(Transform, BoxShape)) {
      const t = world.require(entity, Transform);
      const box = world.require(entity, BoxShape);
      const p = toScreen(c, t.x - box.halfWidth, t.y - box.halfHeight);
      g.rect(p.x, p.y, box.halfWidth * 2 * c.scale, box.halfHeight * 2 * c.scale)
        .fill(COLORS.box)
        .stroke({ width: 2, color: COLORS.boxEdge });
    }
  }

  drawDynamics(world: World, hero: Entity): void {
    const g = this.dynamics;
    const c = this.camera;
    g.clear();
    for (const entity of world.query(Transform, CircleBody)) {
      const t = world.require(entity, Transform);
      const body = world.require(entity, CircleBody);
      const p = toScreen(c, t.x, t.y);
      const isHero = entity === hero;
      g.circle(p.x, p.y, body.radius * c.scale)
        .fill(isHero ? COLORS.hero : COLORS.dummy)
        .stroke({ width: 2, color: isHero ? COLORS.heroEdge : COLORS.dummyEdge });
      if (isHero) {
        // Deux yeux : assez pour que l'on sache qui est le héros.
        const r = body.radius * c.scale;
        g.circle(p.x - r * 0.3, p.y - r * 0.2, r * 0.13).fill(0x1b1d22);
        g.circle(p.x + r * 0.3, p.y - r * 0.2, r * 0.13).fill(0x1b1d22);
      }
    }
  }

  drawPreview(preview: DisclosedPreview | null, heroRadius: number): void {
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
    const color = preview.uncertain ? COLORS.stopUncertain : COLORS.stopSafe;
    if (preview.uncertain) {
      g.circle(stop.x, stop.y, preview.haloRadius * c.scale).fill({ color, alpha: 0.12 }).stroke({ width: 1, color, alpha: 0.5 });
    }
    g.circle(stop.x, stop.y, heroRadius * c.scale).stroke({ width: 3, color, alpha: 0.95 });
  }

  drawTrail(points: readonly Vec2[] | null): void {
    const g = this.trail;
    const c = this.camera;
    g.clear();
    if (!points || points.length < 2) return;
    // Pointillé : un point tous les 10 pixels le long du trajet.
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
}
