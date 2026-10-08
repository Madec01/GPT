/**
 * Écrans de transition par-dessus le jeu : voile, titre, lignes, boutons.
 * Panneaux et boutons du pack quand ils existent, formes sinon.
 */
import { Container, Graphics, NineSliceSprite, Text, type Texture } from 'pixi.js';
import type { AssetBundle } from './assets';
import type { ScreenRect } from './hudView';
import { HUD_COLORS } from './hudView';

export interface OverlayButton {
  id: string;
  label: string;
}

export interface OverlaySpec {
  title: string;
  lines: string[];
  buttons: OverlayButton[];
}

function slice(texture: Texture, width: number, height: number): NineSliceSprite {
  const s = Math.floor(Math.min(texture.width, texture.height) / 3);
  const sprite = new NineSliceSprite({ texture, leftWidth: s, topHeight: s, rightWidth: s, bottomHeight: s });
  sprite.width = width;
  sprite.height = height;
  return sprite;
}

export class OverlayView {
  readonly root = new Container();
  private buttons: Array<{ id: string; rect: ScreenRect }> = [];

  constructor(private readonly assets: AssetBundle | null) {
    this.root.visible = false;
  }

  hit(x: number, y: number): string | null {
    for (const b of this.buttons) {
      if (x >= b.rect.x && x <= b.rect.x + b.rect.width && y >= b.rect.y && y <= b.rect.y + b.rect.height) return b.id;
    }
    return null;
  }

  get visible(): boolean {
    return this.root.visible;
  }

  show(spec: OverlaySpec | null, screenWidth: number, screenHeight: number): void {
    for (const child of this.root.removeChildren()) child.destroy({ children: true });
    this.buttons = [];
    if (!spec) {
      this.root.visible = false;
      return;
    }
    this.root.visible = true;
    const titleFont = this.assets?.fontFamily('title', 'system-ui, sans-serif') ?? 'system-ui, sans-serif';
    const textFont = this.assets?.fontFamily('text', 'system-ui, sans-serif') ?? 'system-ui, sans-serif';
    const w = screenWidth;
    const h = screenHeight;
    this.root.addChild(new Graphics().rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.72 }));

    const title = new Text({ text: spec.title, style: { fill: HUD_COLORS.text, fontSize: 30, fontFamily: titleFont, align: 'center', wordWrap: true, wordWrapWidth: w - 72 } });
    const lines = spec.lines.map(
      (line) => new Text({ text: line, style: { fill: HUD_COLORS.text, fontSize: 16, fontFamily: textFont, align: 'center', wordWrap: true, wordWrapWidth: w - 88 } }),
    );
    const buttonLabels = spec.buttons.map(
      (b) => new Text({ text: b.label, style: { fill: HUD_COLORS.text, fontSize: 17, fontFamily: titleFont, align: 'center', wordWrap: true, wordWrapWidth: w - 120 } }),
    );
    const buttonHeights = buttonLabels.map((l) => Math.max(56, l.height + 24));
    const contentHeight =
      title.height + 16 + lines.reduce((acc, l) => acc + l.height + 8, 0) + 16 + buttonHeights.reduce((acc, bh) => acc + bh + 12, 0) + 32;
    const panelWidth = w - 32;
    const panelX = 16;
    const panelY = Math.max(safeTop(), (h - contentHeight) / 2);
    const panelTexture = this.assets?.ui('panel') ?? null;
    const panel = panelTexture
      ? slice(panelTexture, panelWidth, contentHeight)
      : new Graphics().roundRect(0, 0, panelWidth, contentHeight, 18).fill(0x23262d).stroke({ width: 2, color: HUD_COLORS.buttonEdge });
    panel.x = panelX;
    panel.y = panelY;
    this.root.addChild(panel);

    let y = panelY + 16;
    title.x = w / 2 - title.width / 2;
    title.y = y;
    this.root.addChild(title);
    y += title.height + 16;
    for (const line of lines) {
      line.x = w / 2 - line.width / 2;
      line.y = y;
      this.root.addChild(line);
      y += line.height + 8;
    }
    y += 16;
    const buttonTexture = this.assets?.ui('button') ?? null;
    spec.buttons.forEach((button, i) => {
      const label = buttonLabels[i]!;
      const height = buttonHeights[i]!;
      const rect: ScreenRect = { x: panelX + 20, y, width: panelWidth - 40, height };
      const bg = buttonTexture
        ? slice(buttonTexture, rect.width, rect.height)
        : new Graphics().roundRect(0, 0, rect.width, rect.height, 16).fill(HUD_COLORS.button).stroke({ width: 2, color: HUD_COLORS.buttonEdge });
      bg.x = rect.x;
      bg.y = rect.y;
      label.x = w / 2 - label.width / 2;
      label.y = y + height / 2 - label.height / 2;
      this.root.addChild(bg, label);
      this.buttons.push({ id: button.id, rect });
      y += height + 12;
    });
  }
}

function safeTop(): number {
  const v = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top'));
  return (Number.isFinite(v) ? v : 0) + 24;
}
