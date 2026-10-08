/**
 * Projection de l'arène vers l'écran : l'arène, plus haute que large, est
 * ajustée au viewport en conservant ses proportions, avec des marges réservées
 * à l'interface en haut et en bas.
 */
export interface Margins {
  top: number;
  bottom: number;
  side: number;
}

export const DEFAULT_MARGINS: Margins = { top: 72, bottom: 120, side: 12 };

export interface Camera {
  /** Pixels par unité d'arène. */
  scale: number;
  offsetX: number;
  offsetY: number;
  arenaWidth: number;
  arenaHeight: number;
}

export function fitArena(
  viewportWidth: number,
  viewportHeight: number,
  arenaWidth: number,
  arenaHeight: number,
  margins: Margins = DEFAULT_MARGINS,
): Camera {
  const availableWidth = Math.max(1, viewportWidth - margins.side * 2);
  const availableHeight = Math.max(1, viewportHeight - margins.top - margins.bottom);
  const scale = Math.min(availableWidth / arenaWidth, availableHeight / arenaHeight);
  const drawnWidth = arenaWidth * scale;
  const drawnHeight = arenaHeight * scale;
  return {
    scale,
    offsetX: (viewportWidth - drawnWidth) / 2,
    offsetY: margins.top + (availableHeight - drawnHeight) / 2,
    arenaWidth,
    arenaHeight,
  };
}

export function toScreen(camera: Camera, x: number, y: number): { x: number; y: number } {
  return { x: camera.offsetX + x * camera.scale, y: camera.offsetY + y * camera.scale };
}

export function toArena(camera: Camera, px: number, py: number): { x: number; y: number } {
  return { x: (px - camera.offsetX) / camera.scale, y: (py - camera.offsetY) / camera.scale };
}
