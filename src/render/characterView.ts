/**
 * Vue d'un corps : un sprite unique quand la texture existe, cercle vectoriel
 * sinon, posé sur une ombre. Donne la vie : respiration au repos, orientation
 * selon le mouvement, saut entre deux positions, charge vers une cible,
 * écrasement à l'impact, bulle d'émote, étoiles du sonné.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { AssetBundle, CharacterDef, Expression } from './assets';
import { squashEnvelope, squashScales } from './tween';

export interface CharacterStyle {
  fill: number;
  edge: number;
  eyes?: boolean;
}

/** Les sprites de Dungeon Crawl regardent vers la gauche ; on les retourne pour aller à droite. */
const SPRITES_FACE_LEFT = true;
const HOP_DURATION = 0.28;
const LUNGE_DURATION = 0.32;
const EMOTE_DURATION = 1.1;

export class CharacterView {
  readonly root = new Container();
  private readonly shadow = new Graphics();
  private readonly lift = new Container();
  private readonly squashNode = new Container();
  private readonly body: Sprite | Graphics;
  private readonly emote: Sprite | Graphics;
  private readonly stars = new Graphics();
  private readonly def: CharacterDef | null;
  private expression: Expression = 'neutral';
  private emoteT = Infinity;
  private squashT = Infinity;
  private squashStrength = 0;
  private squashAngle = 0;
  private starsTime = 0;
  private breath = Math.random() * Math.PI * 2;
  private facing = 1;
  private hopT = Infinity;
  private hopDx = 0;
  private hopDy = 0;
  private lungeT = Infinity;
  private lungeDx = 0;
  private lungeDy = 0;
  private aimAngle = 0;
  private aimStrength = 0;
  /** Rayon en pixels, mis à jour par le renderer. */
  radiusPx = 10;

  constructor(
    private readonly assets: AssetBundle | null,
    kind: string,
    private readonly style: CharacterStyle,
    private readonly elite = false,
    private readonly isHero = false,
  ) {
    this.def = assets?.character(kind) ?? null;
    const key = (elite ? this.def?.elite : null) ?? this.def?.sprite;
    const texture = assets?.texture(key) ?? null;
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, this.def?.anchorY ?? 0.5);
      if (elite && !this.def?.elite) sprite.tint = 0xffb4b4;
      this.body = sprite;
    } else {
      this.body = new Graphics();
    }
    const anyEmote = assets?.emote('hit') ?? assets?.emote('happy') ?? null;
    this.emote = anyEmote ? new Sprite(anyEmote) : new Graphics();
    this.emote.visible = false;
    this.squashNode.addChild(this.body);
    this.lift.addChild(this.squashNode, this.stars, this.emote);
    this.root.addChild(this.shadow, this.lift);
    this.stars.visible = false;
  }

  get hasTextures(): boolean {
    return this.body instanceof Sprite;
  }

  private spriteKey(): string | null | undefined {
    return (this.elite ? this.def?.elite : null) ?? this.def?.sprite;
  }

  setExpression(expression: Expression): void {
    if (expression === this.expression) return;
    this.expression = expression;
    if (expression === 'neutral' || expression === 'aim' || expression === 'flight') {
      if (expression !== 'flight') this.emote.visible = false;
      if (expression === 'flight') this.showEmote('flight');
      return;
    }
    this.showEmote(expression);
  }

  /** Bulle au-dessus de la tête : texture du manifeste, sinon un petit signe dessiné. */
  private showEmote(expression: Expression): void {
    this.emoteT = 0;
    const texture: Texture | null = this.assets?.emote(expression) ?? null;
    if (this.emote instanceof Sprite) {
      if (!texture) {
        this.emote.visible = false;
        return;
      }
      this.emote.texture = texture;
      this.emote.anchor.set(0.5, 1);
    } else {
      const g = this.emote;
      g.clear();
      const color = expression === 'hit' || expression === 'worried' ? 0xef4444 : expression === 'happy' ? 0x4ade80 : expression === 'stunned' ? 0xfde047 : 0xf9fafb;
      g.roundRect(-11, -24, 22, 18, 6).fill({ color: 0xffffff, alpha: 0.92 }).stroke({ width: 2, color: 0x111318 });
      g.poly([-4, -6, 4, -6, 0, 0]).fill({ color: 0xffffff, alpha: 0.92 });
      const glyph = expression === 'hit' ? '!' : expression === 'worried' ? '?' : expression === 'happy' ? '♥' : expression === 'stunned' ? '✶' : expression === 'impact' ? '✸' : '~';
      void glyph;
      g.circle(0, -15, 4).fill(color);
    }
    this.emote.visible = true;
  }

  /** Déclenche un écrasement le long de la normale (en radians écran), force dans [0, 1]. */
  punch(angle: number, strength: number): void {
    this.squashT = 0;
    this.squashStrength = Math.min(1, Math.max(0, strength));
    this.squashAngle = angle;
  }

  /** Saut visuel depuis un décalage d'arène (en pixels écran) vers la position réelle. */
  hop(dxPx: number, dyPx: number): void {
    this.hopT = 0;
    this.hopDx = dxPx;
    this.hopDy = dyPx;
  }

  /** Charge vers une direction écran puis retour, pour l'attaque d'un ennemi. */
  lunge(dirX: number, dirY: number): void {
    this.lungeT = 0;
    const len = Math.hypot(dirX, dirY) || 1;
    this.lungeDx = dirX / len;
    this.lungeDy = dirY / len;
  }

  /** Anticipation de la visée : étirement vers l'arrière de la direction de lancer. */
  anticipate(angle: number, strength: number): void {
    this.aimAngle = angle;
    this.aimStrength = Math.min(1, Math.max(0, strength));
  }

  setStunned(stunned: boolean): void {
    this.stars.visible = stunned;
  }

  /** Teinte du corps, 0xffffff pour aucune. */
  setTint(tint: number): void {
    if (this.body instanceof Sprite && !(this.elite && !this.def?.elite)) this.body.tint = tint;
  }

  /** Met à jour la géométrie : position et rayon en pixels, temps écoulé, vitesse écran en pixels par seconde. */
  update(x: number, y: number, radiusPx: number, dt: number, vx = 0, vy = 0): void {
    this.root.x = x;
    this.root.y = y;
    this.radiusPx = radiusPx;
    const diameter = radiusPx * 2;
    const speed = Math.hypot(vx, vy);
    const moving = speed > 12;

    // Ombre : un disque aplati, plus petit et plus pâle quand le corps est en l'air.
    this.hopT += dt;
    const hopK = this.hopT < HOP_DURATION ? 1 - this.hopT / HOP_DURATION : 0;
    const air = Math.sin(hopK * Math.PI);
    this.shadow.clear();
    const shadowAlpha = (this.hasTextures ? 0.16 : 0.28) - air * 0.08;
    this.shadow.ellipse(0, radiusPx * 0.85, radiusPx * (0.95 - air * 0.25), radiusPx * (0.38 - air * 0.1)).fill({ color: 0x000000, alpha: shadowAlpha });

    // Saut : décalage résiduel vers l'ancienne position, avec un arc.
    this.lift.x = this.hopDx * hopK * hopK;
    this.lift.y = this.hopDy * hopK * hopK - air * radiusPx * 0.9;

    // Charge : aller vite, revenir doucement.
    this.lungeT += dt;
    if (this.lungeT < LUNGE_DURATION) {
      const u = this.lungeT / LUNGE_DURATION;
      const k = u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7;
      this.lift.x += this.lungeDx * k * radiusPx * 1.1;
      this.lift.y += this.lungeDy * k * radiusPx * 1.1;
    }

    if (this.body instanceof Sprite) {
      const ppu = this.assets!.pixelsPerUnit(this.spriteKey());
      const scale = (diameter / ppu) * (this.def?.scale ?? 1.2);
      // Orientation : le héros regarde où il vole, les autres se retournent selon leur marche.
      if (moving) this.facing = vx >= 0 ? 1 : -1;
      const flip = SPRITES_FACE_LEFT ? -this.facing : this.facing;
      this.body.scale.set(scale * flip, scale);
      if (this.isHero && moving && speed > 90) {
        const a = Math.atan2(vy, vx);
        this.body.rotation = this.facing === 1 ? a : a - Math.PI;
      } else {
        this.body.rotation *= Math.max(0, 1 - dt * 10);
      }
    } else {
      this.drawFallback(radiusPx);
      this.body.rotation = 0;
    }

    // Respiration au repos, étirement en vol, anticipation de visée.
    this.breath += dt * (moving ? 9 : 2.6);
    const breathe = moving ? 0 : 0.035 * Math.sin(this.breath);
    let along = 1 + breathe;
    let across = 1 - breathe;
    let rotation = 0;
    if (moving && speed > 90) {
      const stretch = Math.min(0.22, (speed - 90) / 900);
      along = 1 + stretch;
      across = 1 - stretch * 0.6;
      rotation = Math.atan2(vy, vx);
    }
    if (this.aimStrength > 0) {
      along = 1 + this.aimStrength * 0.18;
      across = 1 - this.aimStrength * 0.1;
      rotation = this.aimAngle;
    }
    this.squashT += dt;
    const amount = squashEnvelope(this.squashT);
    if (amount !== 0) {
      const s = squashScales(amount, this.squashStrength * 0.35);
      along = s.along;
      across = s.across;
      rotation = this.squashAngle;
    }
    this.squashNode.rotation = rotation;
    this.squashNode.scale.set(along, across);
    // Contre-rotation du corps pour que la pose reste droite quand l'écrasement a une direction.
    if (this.body instanceof Sprite && !(this.isHero && moving && speed > 90)) this.body.rotation = -rotation;
    else if (this.body instanceof Graphics) this.body.rotation = -rotation;

    // Bulle d'émote : apparaît, flotte, s'efface.
    this.emoteT += dt;
    if (this.emote.visible) {
      const u = Math.min(1, this.emoteT / EMOTE_DURATION);
      const pop = u < 0.15 ? u / 0.15 : 1;
      this.emote.scale.set(pop * (this.emote instanceof Sprite ? Math.min(1, (radiusPx * 1.4) / Math.max(1, this.emote.texture.height)) : 1));
      this.emote.x = radiusPx * 0.7;
      this.emote.y = -radiusPx * 1.05 - u * 6;
      this.emote.alpha = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
      if (u >= 1 && this.expression !== 'flight') this.emote.visible = false;
    }

    if (this.stars.visible) {
      this.starsTime += dt;
      this.drawStars(radiusPx);
    }
  }

  private drawFallback(radiusPx: number): void {
    const g = this.body as Graphics;
    g.clear();
    g.circle(0, 0, radiusPx).fill(this.elite ? 0xf87171 : this.style.fill).stroke({ width: 2, color: this.style.edge });
    if (this.style.eyes) {
      const r = radiusPx;
      const squint = this.expression === 'aim' || this.expression === 'impact';
      const eyeR = squint ? r * 0.08 : this.expression === 'flight' ? r * 0.17 : r * 0.13;
      g.circle(-r * 0.3, -r * 0.2, eyeR).fill(0x1b1d22);
      g.circle(r * 0.3, -r * 0.2, eyeR).fill(0x1b1d22);
      if (this.expression === 'happy') g.moveTo(-r * 0.25, r * 0.25).lineTo(0, r * 0.4).lineTo(r * 0.25, r * 0.25).stroke({ width: 2, color: 0x1b1d22 });
      if (this.expression === 'worried' || this.expression === 'hit') g.moveTo(-r * 0.25, r * 0.4).lineTo(r * 0.25, r * 0.3).stroke({ width: 2, color: 0x1b1d22 });
    }
  }

  private drawStars(radiusPx: number): void {
    const g = this.stars;
    g.clear();
    const t = this.starsTime * 3;
    for (let i = 0; i < 3; i++) {
      const a = t + (i * Math.PI * 2) / 3;
      g.circle(Math.cos(a) * radiusPx * 0.9, -radiusPx - 10 + Math.sin(a) * 4, 3).fill(0xfde047);
    }
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}
