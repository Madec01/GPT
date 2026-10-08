/**
 * Générateur pseudo-aléatoire seedé (mulberry32).
 *
 * C'est la seule source d'aléatoire autorisée dans la simulation. Son état
 * est un entier 32 bits exposé en lecture et en écriture pour que le clonage
 * d'une simulation reproduise exactement la suite de tirages.
 */
export interface Rng {
  /** Nombre dans [0, 1). */
  next(): number;
  /** Entier dans [min, max] inclus. */
  int(min: number, max: number): number;
  /** Élément choisi uniformément ; lance si le tableau est vide. */
  pick<T>(items: readonly T[]): T;
  /** État interne, pour clonage et sérialisation. */
  getState(): number;
  setState(state: number): void;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(items) {
      if (items.length === 0) throw new Error('rng.pick : tableau vide');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    getState: () => state,
    setState(s) {
      state = s >>> 0;
    },
  };
}
