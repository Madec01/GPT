/**
 * Vue d'un corps rond : corps, yeux et bouche en couches quand les textures
 * existent, cercle vectoriel sinon. Gère l'expression, l'écrasement à l'impact
 * et les étoiles du sonné.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { AssetBundle, CharacterDef, Expression } from './assets';
import { squashEnvelope, squashScales } from './tween';

export interface CharacterStyle {
  fill: number;
  edge: number;
  eyes?: boolean;
}

export class CharacterView {
  readonly root = new Container();
  private readonly squashNode = new Container();
  private readonly body: Sprite | Graphics;
  private readonly eyes: Sprite | null;
  private readonly mouth: Sprite | null;
  private readonly stars = new Graphics();
  private readonly def: CharacterDef | null;
  private expression: Expression = 'neutral';
  private squashT = Infinity;
  private squashStrength = 0;
  private squashAngle = 0;
  private starsTime = 0;
  /** Rayon en pixels, mis à jour par le renderer. */
  radiusPx = 10;

  constructor(
    private readonly assets: AssetBundle | null,
    kind: string,
    private readonly style: CharacterStyle,
  ) {
    this.def = assets?.character(kind) ?? null;
    const bodyTexture = assets?.texture(this.def?.body) ?? null;
    if (bodyTexture) {
      const sprite = new Sprite(bodyTexture);
      sprite.anchor.set(0.5);
      this.body = sprite;
    } else {
      this.body = new Graphics();
    }
    this.squashNode.addChild(this.body);
    this.eyes = this.layer(this.def?.eyes['neutral']);
    this.mouth = this.layer(this.def?.mouth['neutral']);
    if (this.eyes) this.squashNode.addChild(this.eyes);
    if (this.mouth) this.squashNode.addChild(this.mouth);
    this.root.addChild(this.squashNode, this.stars);
    this.stars.visible = false;
  }

  private layer(key: string | null | undefined): Sprite | null {
    const texture = this.assets?.texture(key) ?? null;
    if (!texture) return null;
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }

  get hasTextures(): boolean {
    return this.body instanceof Sprite;
  }

  setExpression(expression: Expression): void {
    if (expression === this.expression) return;
    this.expression = expression;
    this.applyLayer(this.eyes, this.def?.eyes, expression);
    this.applyLayer(this.mouth, this.def?.mouth, expression);
  }

  private applyLayer(sprite: Sprite | null, table: Partial<Record<Expression, string | null>> | undefined, expression: Expression): void {
    if (!sprite || !table) return;
    const key = table[expression] ?? table['neutral'];
    const texture: Texture | null = this.assets?.texture(key) ?? null;
    if (texture) sprite.texture = texture;
  }

  /** Déclenche un écrasement le long de la normale (en radians écran), force dans [0, 1]. */
  punch(angle: number, strength: number): void {
    this.squashT = 0;
    this.squashStrength = Math.min(1, Math.max(0, strength));
    this.squashAngle = angle;
  }

  setStunned(stunned: boolean): void {
    this.stars.visible = stunned;
  }

  /** Met à jour la géométrie : position en pixels, rayon en pixels, temps écoulé en secondes. */
  update(x: number, y: number, radiusPx: number, dt: number): void {
    this.root.x = x;
    this.root.y = y;
    this.radiusPx = radiusPx;
    const diameter = radiusPx * 2;

    if (this.body instanceof Sprite) {
      const ppu = this.assets!.pixelsPerUnit(this.def?.body);
      const scale = diameter / ppu;
      this.body.scale.set(scale);
      this.placeLayer(this.eyes, this.def?.eyes['neutral'], this.def?.eyesOffset, diameter, scale);
      this.placeLayer(this.mouth, this.def?.mouth['neutral'], this.def?.mouthOffset, diameter, scale);
    } else {
      this.drawFallback(radiusPx);
    }

    this.squashT += dt;
    const amount = squashEnvelope(this.squashT);
    if (amount !== 0) {
      const { along, across } = squashScales(amount, this.squashStrength * 0.35);
      this.squashNode.rotation = this.squashAngle;
      this.squashNode.scale.set(along, across);
      // Contre-rotation des couches pour que le visage reste droit.
      this.body.rotation = -this.squashAngle;
      if (this.eyes) this.eyes.rotation = -this.squashAngle;
      if (this.mouth) this.mouth.rotation = -this.squashAngle;
    } else {
      this.squashNode.rotation = 0;
      this.squashNode.scale.set(1);
      this.body.rotation = 0;
      if (this.eyes) this.eyes.rotation = 0;
      if (this.mouth) this.mouth.rotation = 0;
    }

    if (this.stars.visible) {
      this.starsTime += dt;
      this.drawStars(radiusPx);
    }
  }

  private placeLayer(sprite: Sprite | null, key: string | null | undefined, offset: { x: number; y: number } | undefined, diameter: number, bodyScale: number): void {
    if (!sprite) return;
    const ppu = this.assets!.pixelsPerUnit(key);
    const layerScale = (diameter / ppu) * (ppu / this.assets!.pixelsPerUnit(this.def?.body)) ;
    sprite.scale.set(layerScale || bodyScale);
    sprite.x = (offset?.x ?? 0) * diameter;
    sprite.y = (offset?.y ?? 0) * diameter;
  }

  private drawFallback(radiusPx: number): void {
    const g = this.body as Graphics;
    g.clear();
    g.circle(0, 0, radiusPx).fill(this.style.fill).stroke({ width: 2, color: this.style.edge });
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
