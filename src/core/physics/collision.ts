/**
 * Calculs de temps d'impact (TOI) entre un cercle en mouvement rectiligne et
 * les autres formes. Toutes les fonctions sont pures.
 *
 * Convention : la normale renvoyée pointe vers le cercle interrogé (ou, pour
 * deux cercles, du premier vers le second).
 */
import type { Vec2 } from '../math/vec2';

export interface Toi {
  /** Temps d'impact dans [0, horizon], ou `null` si aucun contact n'arrive. */
  t: number;
  nx: number;
  ny: number;
}

/** Tolérance de contact : en dessous, deux formes sont considérées en contact. */
const EPSILON = 1e-9;

/**
 * Premier instant où le cercle (centre `p`, rayon `r`, vitesse `v`) touche le
 * segment AB, à l'intérieur de l'horizon de temps. Le cercle doit s'approcher :
 * un cercle déjà en contact qui s'éloigne ne renvoie rien.
 */
export function circleSegmentToi(
  p: Vec2,
  v: Vec2,
  r: number,
  a: Vec2,
  b: Vec2,
  horizon: number,
): Toi | null {
  let best: Toi | null = null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq > 0) {
    const len = Math.sqrt(lengthSq);
    const ux = dx / len;
    const uy = dy / len;
    // Normale unitaire de la ligne.
    const nx = -uy;
    const ny = ux;
    const s0 = (p.x - a.x) * nx + (p.y - a.y) * ny; // distance signée à la ligne
    const vn = v.x * nx + v.y * ny;
    // Côté d'approche : celui où se trouve le cercle, ou, s'il est sur la ligne, celui d'où il vient.
    const side = s0 > 0 ? 1 : s0 < 0 ? -1 : vn < 0 ? 1 : -1;
    if (vn * side < 0) {
      const t = Math.max(0, (side * r - s0) / vn);
      if (t <= horizon) {
        const qx = p.x + v.x * t;
        const qy = p.y + v.y * t;
        const proj = (qx - a.x) * ux + (qy - a.y) * uy;
        if (proj >= 0 && proj <= len) {
          best = { t, nx: nx * side, ny: ny * side };
        }
      }
    }
  }

  const endA = circlePointToi(p, v, r, a, horizon);
  if (endA && (!best || endA.t < best.t)) best = endA;
  const endB = circlePointToi(p, v, r, b, horizon);
  if (endB && (!best || endB.t < best.t)) best = endB;
  return best;
}

/** Cercle en mouvement contre un point fixe (extrémité de segment). */
export function circlePointToi(p: Vec2, v: Vec2, r: number, c: Vec2, horizon: number): Toi | null {
  const px = p.x - c.x;
  const py = p.y - c.y;
  const aa = v.x * v.x + v.y * v.y;
  const bb = 2 * (px * v.x + py * v.y);
  const cc = px * px + py * py - r * r;
  if (bb >= 0) return null; // ne s'approche pas
  let t: number;
  if (cc <= EPSILON) {
    t = 0; // déjà en contact ou en pénétration, et en approche
  } else {
    if (aa === 0) return null;
    const disc = bb * bb - 4 * aa * cc;
    if (disc < 0) return null;
    t = (-bb - Math.sqrt(disc)) / (2 * aa);
    if (t < 0) t = 0;
    if (t > horizon) return null;
  }
  const qx = px + v.x * t;
  const qy = py + v.y * t;
  const len = Math.sqrt(qx * qx + qy * qy);
  if (len === 0) return null;
  return { t, nx: qx / len, ny: qy / len };
}

/**
 * Deux cercles en mouvement. La normale va du premier vers le second.
 */
export function circleCircleToi(
  p1: Vec2,
  v1: Vec2,
  r1: number,
  p2: Vec2,
  v2: Vec2,
  r2: number,
  horizon: number,
): Toi | null {
  const px = p2.x - p1.x;
  const py = p2.y - p1.y;
  const vx = v2.x - v1.x;
  const vy = v2.y - v1.y;
  const rr = r1 + r2;
  const aa = vx * vx + vy * vy;
  const bb = 2 * (px * vx + py * vy);
  const cc = px * px + py * py - rr * rr;
  if (bb >= 0) return null; // les centres ne se rapprochent pas
  let t: number;
  if (cc <= EPSILON) {
    t = 0;
  } else {
    if (aa === 0) return null;
    const disc = bb * bb - 4 * aa * cc;
    if (disc < 0) return null;
    t = (-bb - Math.sqrt(disc)) / (2 * aa);
    if (t < 0) t = 0;
    if (t > horizon) return null;
  }
  const qx = px + vx * t;
  const qy = py + vy * t;
  const len = Math.sqrt(qx * qx + qy * qy);
  if (len === 0) return null;
  return { t, nx: qx / len, ny: qy / len };
}

/** Point du segment AB le plus proche de P. */
export function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return a;
  let s = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  s = s < 0 ? 0 : s > 1 ? 1 : s;
  return { x: a.x + dx * s, y: a.y + dy * s };
}
