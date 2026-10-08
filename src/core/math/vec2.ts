/**
 * Vecteurs 2D en données simples `{ x, y }`.
 *
 * Toutes les fonctions sont pures et n'utilisent que les quatre opérations et
 * la racine carrée, exactes en IEEE 754 : la simulation reste identique d'un
 * moteur JavaScript à l'autre.
 */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const ZERO: Vec2 = { x: 0, y: 0 };

export function vec(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vec2, k: number): Vec2 {
  return { x: a.x * k, y: a.y * k };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function lengthSq(a: Vec2): number {
  return a.x * a.x + a.y * a.y;
}

export function length(a: Vec2): number {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

/** Vecteur unitaire, ou le vecteur nul si la longueur est nulle. */
export function normalize(a: Vec2): Vec2 {
  const len = length(a);
  return len === 0 ? ZERO : { x: a.x / len, y: a.y / len };
}

/** Normale unitaire obtenue par rotation d'un quart de tour, sans trigonométrie. */
export function perpendicular(a: Vec2): Vec2 {
  return { x: -a.y, y: a.x };
}

export function clampLength(a: Vec2, max: number): Vec2 {
  const len = length(a);
  return len <= max || len === 0 ? a : scale(a, max / len);
}
