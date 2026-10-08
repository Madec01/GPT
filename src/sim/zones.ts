/**
 * Zones au sol : disques et polygones convexes. Servent aux intentions des
 * ennemis, aux gouffres, aux zones d'éboulement et aux cibles d'objectif.
 * Toutes les fonctions sont pures et sans trigonométrie.
 */
import type { Vec2 } from '../core/math/vec2';

export type Zone =
  | { kind: 'disc'; x: number; y: number; r: number }
  | { kind: 'poly'; points: Vec2[] };

export function disc(x: number, y: number, r: number): Zone {
  return { kind: 'disc', x, y, r };
}

export function poly(points: Vec2[]): Zone {
  return { kind: 'poly', points };
}

/** Rectangle aligné sur les axes, donné par son centre et sa taille. */
export function rect(x: number, y: number, width: number, height: number): Zone {
  const hw = width / 2;
  const hh = height / 2;
  return poly([
    { x: x - hw, y: y - hh },
    { x: x + hw, y: y - hh },
    { x: x + hw, y: y + hh },
    { x: x - hw, y: y + hh },
  ]);
}

export function pointInZone(x: number, y: number, zone: Zone): boolean {
  if (zone.kind === 'disc') {
    const dx = x - zone.x;
    const dy = y - zone.y;
    return dx * dx + dy * dy <= zone.r * zone.r;
  }
  return pointInConvexPolygon(x, y, zone.points);
}

/** Vrai si le cercle chevauche la zone, même partiellement. */
export function circleIntersectsZone(cx: number, cy: number, r: number, zone: Zone): boolean {
  if (zone.kind === 'disc') {
    const dx = cx - zone.x;
    const dy = cy - zone.y;
    const rr = r + zone.r;
    return dx * dx + dy * dy <= rr * rr;
  }
  return distancePointToConvexPolygon(cx, cy, zone.points) <= r;
}

/** Vrai si le cercle est entièrement contenu dans la zone. */
export function circleInsideZone(cx: number, cy: number, r: number, zone: Zone): boolean {
  if (zone.kind === 'disc') {
    const dx = cx - zone.x;
    const dy = cy - zone.y;
    const margin = zone.r - r;
    return margin >= 0 && dx * dx + dy * dy <= margin * margin;
  }
  if (!pointInConvexPolygon(cx, cy, zone.points)) return false;
  return distancePointToPolygonEdges(cx, cy, zone.points) >= r;
}

function pointInConvexPolygon(x: number, y: number, points: Vec2[]): boolean {
  const n = points.length;
  if (n < 3) return false;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross === 0) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

function distancePointToPolygonEdges(x: number, y: number, points: Vec2[]): number {
  let best = Infinity;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    let t = lengthSq === 0 ? 0 : ((x - a.x) * dx + (y - a.y) * dy) / lengthSq;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = a.x + dx * t - x;
    const qy = a.y + dy * t - y;
    const d = Math.sqrt(qx * qx + qy * qy);
    if (d < best) best = d;
  }
  return best;
}

/** Distance d'un point à un polygone convexe : zéro à l'intérieur. */
export function distancePointToConvexPolygon(x: number, y: number, points: Vec2[]): number {
  if (pointInConvexPolygon(x, y, points)) return 0;
  return distancePointToPolygonEdges(x, y, points);
}

/** Décale une zone d'un vecteur. */
export function translateZone(zone: Zone, dx: number, dy: number): Zone {
  if (zone.kind === 'disc') return { kind: 'disc', x: zone.x + dx, y: zone.y + dy, r: zone.r };
  return { kind: 'poly', points: zone.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
}
