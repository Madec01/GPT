/**
 * Interface de jeu en pixels d'écran : cœurs, salle et tour, objectif, frein,
 * pouvoir et jauge. Textures du pack quand elles existent, formes sinon.
 */
import { Container, Graphics, NineSliceSprite, Sprite, Text, type Texture } from 'pixi.js';
import type { AssetBundle } from './assets';

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
  brakeSide: 'left' | 'right';
}

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const HUD_COLORS = {
  text: 0xf3e9d2,
  dim: 0x7c7f88,
  heart: 0xf472b6,
  charge: 0xfbbf24,
  button: 0x374151,
  buttonEdge: 0x9ca3af,
  background: 0x1b1d22,
} as const;

const BUTTON = 72;

function makePanel(texture: Texture | null, width: number, height: number): NineSliceSprite | Graphics {
  if (texture) {
    const slice = Math.floor(Math.min(texture.width, texture.height) / 3);
    const panel = new NineSliceSprite({ texture, leftWidth: slice, topHeight: slice, rightWidth: slice, bottomHeight: slice });
    panel.width = width;
    panel.height = height;
    return panel;
  }
  return new Graphics().roundRect(0, 0, width, height, 14).fill(HUD_COLORS.button).stroke({ width: 2, color: HUD_COLORS.buttonEdge });
}

export class HudView {
  readonly root = new Container();
  private readonly hearts: Array<{ full: Sprite | Graphics; empty: Sprite | Graphics }> = [];
  private readonly chargeSegments: Array<{ on: Sprite | Graphics; off: Sprite | Graphics }> = [];
  private readonly brakePanel: NineSliceSprite | Graphics;
  private readonly brakePressed: NineSliceSprite | Graphics;
  private readonly powerPanel: NineSliceSprite | Graphics;
  private readonly brakeIcon: Sprite | null;
  private readonly powerIcon: Sprite | null;
  private readonly roomText: Text;
  private readonly objectiveText: Text;
  private readonly brakeText: Text;
  private readonly powerText: Text;
  private brakeRect: ScreenRect = { x: 0, y: 0, width: 0, height: 0 };
  private chargeMax = 3;

  constructor(private readonly assets: AssetBundle | null) {
    const titleFont = assets?.fontFamily('title', 'system-ui, sans-serif') ?? 'system-ui, sans-serif';
    const textFont = assets?.fontFamily('text', 'system-ui, sans-serif') ?? 'system-ui, sans-serif';
    this.roomText = new Text({ text: '', style: { fill: HUD_COLORS.text, fontSize: 16, fontFamily: titleFont } });
    this.objectiveText = new Text({ text: '', style: { fill: HUD_COLORS.dim, fontSize: 13, fontFamily: textFont, fontWeight: '600' } });
    this.brakeText = new Text({ text: 'FREIN', style: { fill: HUD_COLORS.text, fontSize: 13, fontFamily: titleFont } });
    this.powerText = new Text({ text: '', style: { fill: HUD_COLORS.text, fontSize: 11, fontFamily: titleFont, align: 'center' } });

    this.brakePanel = makePanel(assets?.ui('button') ?? null, BUTTON, BUTTON);
    this.brakePressed = makePanel(assets?.ui('buttonPressed') ?? assets?.ui('button') ?? null, BUTTON, BUTTON);
    this.powerPanel = makePanel(assets?.ui('button') ?? null, BUTTON, BUTTON);
    this.brakeIcon = this.icon(assets?.ui('iconBrake') ?? null);
    this.powerIcon = this.icon(assets?.ui('iconPower') ?? null);

    this.root.addChild(this.brakePanel, this.brakePressed, this.powerPanel);
    if (this.brakeIcon) this.root.addChild(this.brakeIcon);
    if (this.powerIcon) this.root.addChild(this.powerIcon);
    this.root.addChild(this.roomText, this.objectiveText, this.brakeText, this.powerText);
  }

  private icon(texture: Texture | null): Sprite | null {
    if (!texture) return null;
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    const s = 28 / Math.max(texture.width, texture.height);
    sprite.scale.set(s);
    return sprite;
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

  private segment(on: boolean, width: number): Sprite | Graphics {
    const texture = this.assets?.ui(on ? 'chargeOn' : 'chargeOff') ?? null;
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.width = width;
      sprite.height = 12;
      return sprite;
    }
    return new Graphics().roundRect(0, 0, width, 12, 3).fill(on ? HUD_COLORS.charge : HUD_COLORS.background).stroke({ width: 1, color: HUD_COLORS.buttonEdge });
  }

  hitBrake(x: number, y: number): boolean {
    const r = this.brakeRect;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }

  update(state: HudState, screenWidth: number, screenHeight: number, safeTop: number, safeBottom: number): void {
    while (this.hearts.length < state.maxHp) {
      const pair = { full: this.heart(true), empty: this.heart(false) };
      this.root.addChild(pair.empty, pair.full);
      this.hearts.push(pair);
    }
    this.hearts.forEach((pair, i) => {
      const x = 22 + i * 26;
      const y = safeTop + 24;
      pair.full.x = pair.empty.x = x;
      pair.full.y = pair.empty.y = y;
      pair.full.visible = i < state.hp;
      pair.empty.visible = i >= state.hp;
    });

    this.roomText.text = `${state.roomName} · tour ${state.turn}`;
    this.roomText.x = screenWidth - this.roomText.width - 16;
    this.roomText.y = safeTop + 10;
    this.objectiveText.text = state.objective;
    this.objectiveText.x = screenWidth - this.objectiveText.width - 16;
    this.objectiveText.y = safeTop + 34;

    const y = screenHeight - safeBottom - BUTTON - 20;
    const brakeX = state.brakeSide === 'left' ? 18 : screenWidth - 18 - BUTTON;
    const powerX = state.brakeSide === 'left' ? screenWidth - 18 - BUTTON : 18;
    this.brakeRect = { x: brakeX, y, width: BUTTON, height: BUTTON };
    this.brakePanel.x = this.brakePressed.x = brakeX;
    this.brakePanel.y = this.brakePressed.y = y;
    this.brakePressed.visible = state.brakeAvailable && state.brakeActive;
    this.brakePanel.visible = !this.brakePressed.visible;
    this.brakePanel.alpha = state.brakeAvailable ? 1 : 0.35;
    if (this.brakeIcon) {
      this.brakeIcon.x = brakeX + BUTTON / 2;
      this.brakeIcon.y = y + BUTTON / 2 - 8;
      this.brakeIcon.alpha = state.brakeAvailable ? 1 : 0.35;
    }
    this.brakeText.style.fill = state.brakeAvailable ? HUD_COLORS.text : HUD_COLORS.dim;
    this.brakeText.x = brakeX + BUTTON / 2 - this.brakeText.width / 2;
    this.brakeText.y = this.brakeIcon ? y + BUTTON - 22 : y + BUTTON / 2 - this.brakeText.height / 2;

    this.powerPanel.x = powerX;
    this.powerPanel.y = y;
    const hasPower = state.form !== 'none';
    if (this.powerIcon) {
      this.powerIcon.x = powerX + BUTTON / 2;
      this.powerIcon.y = y + 22;
      this.powerIcon.alpha = hasPower ? 1 : 0.3;
    }
    this.powerText.text = hasPower ? state.form.toUpperCase() : 'SANS\nPOUVOIR';
    this.powerText.style.fill = hasPower ? HUD_COLORS.text : HUD_COLORS.dim;
    this.powerText.style.fontSize = hasPower ? 12 : 9;
    this.powerText.x = powerX + BUTTON / 2 - this.powerText.width / 2;
    this.powerText.y = this.powerIcon ? y + 38 : y + (hasPower ? 12 : 6);

    if (this.chargeMax !== state.chargeMax || this.chargeSegments.length === 0) {
      for (const seg of this.chargeSegments) {
        seg.on.destroy();
        seg.off.destroy();
      }
      this.chargeSegments.length = 0;
      this.chargeMax = state.chargeMax;
      const segW = (BUTTON - 16 - (state.chargeMax - 1) * 4) / state.chargeMax;
      for (let i = 0; i < state.chargeMax; i++) {
        const pair = { on: this.segment(true, segW), off: this.segment(false, segW) };
        this.root.addChild(pair.off, pair.on);
        this.chargeSegments.push(pair);
      }
    }
    const segW = (BUTTON - 16 - (state.chargeMax - 1) * 4) / state.chargeMax;
    this.chargeSegments.forEach((pair, i) => {
      const x = powerX + 8 + i * (segW + 4);
      pair.on.x = pair.off.x = x;
      pair.on.y = pair.off.y = y + BUTTON - 20;
      pair.on.visible = hasPower && i < state.charge;
      pair.off.visible = !pair.on.visible;
    });
  }
}
