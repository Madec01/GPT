/**
 * Petites fonctions d'animation pures : décroissance d'un écrasement avec
 * léger rebond, interpolations. Testables en Node.
 */

/**
 * Amplitude d'écrasement à l'instant `t` (secondes) après un choc :
 * part de 1, oscille une fois en sens inverse, revient à 0 vers `duration`.
 */
export function squashEnvelope(t: number, duration = 0.18): number {
  if (t <= 0) return 1;
  if (t >= duration) return 0;
  const x = t / duration;
  // Cosinus amorti approché par un polynôme : 1 à 0, -0,35 vers 0,55, 0 à 1.
  const damping = (1 - x) * (1 - x);
  const wave = 1 - 2.7 * x + 1.7 * x * x;
  return damping * wave;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Facteur d'échelle d'un cercle écrasé : `along` le long de la normale, `across` perpendiculairement. */
export function squashScales(amount: number, strength: number): { along: number; across: number } {
  const k = amount * strength;
  return { along: 1 - k, across: 1 + k * 0.7 };
}
