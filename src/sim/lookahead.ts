/**
 * Prédiction d'un lancer : la simulation est clonée et jouée jusqu'à
 * l'arrêt. Comme elle est déterministe, la prédiction est exacte. Ce que l'on
 * montre au joueur est une décision de divulgation prise par le rendu, pas par
 * ce module.
 */
import type { Vec2 } from '../core/math/vec2';
import type { Simulation } from './simulation';

export interface Prediction {
  /** Trajet échantillonné du héros, du départ à l'arrêt. */
  path: Vec2[];
  /** Position du héros à son premier contact, ou `null` s'il s'arrête sans rien toucher. */
  firstContact: Vec2 | null;
  /** Position d'arrêt. */
  stop: Vec2;
  /** Vrai si le trajet passe par un contact avec un corps mobile. */
  touchedDynamic: boolean;
  steps: number;
  /** Faux si le garde-fou de pas a interrompu la prédiction. */
  completed: boolean;
}

export interface PredictOptions {
  maxSteps?: number;
  /** Un point de trajet tous les N pas, en plus des contacts. */
  sampleEvery?: number;
}

export function predictThrow(sim: Simulation, vx: number, vy: number, options: PredictOptions = {}): Prediction {
  const probe = sim.clone();
  const t = probe.heroTransform();
  const start = { x: t.x, y: t.y };
  if (!probe.throwHero(vx, vy)) {
    return { path: [start], firstContact: null, stop: start, touchedDynamic: false, steps: 0, completed: true };
  }
  return traceMotion(probe, start, options);
}

/**
 * Suit un lancer déjà déclenché sur une simulation jetable jusqu'à l'arrêt.
 * La simulation passée est consommée : ne pas la réutiliser.
 */
export function traceMotion(probe: Simulation, start: Vec2, options: PredictOptions = {}): Prediction {
  const maxSteps = options.maxSteps ?? probe.config.maxStepsPerThrow;
  const sampleEvery = options.sampleEvery ?? 4;
  const path: Vec2[] = [{ x: start.x, y: start.y }];
  let firstContact: Vec2 | null = null;
  let touchedDynamic = false;
  let steps = 0;

  while (probe.phase === 'moving' && steps < maxSteps) {
    const events = probe.tick();
    steps++;
    const t = probe.heroTransform();
    let heroContact = false;
    for (const event of events) {
      if (event.a !== probe.hero && event.b !== probe.hero) continue;
      heroContact = true;
      if (event.segment === null) touchedDynamic = true;
      if (!firstContact) firstContact = { x: event.x, y: event.y };
    }
    if (heroContact || steps % sampleEvery === 0) path.push({ x: t.x, y: t.y });
  }

  const end = probe.heroTransform();
  const stop = { x: end.x, y: end.y };
  const last = path[path.length - 1]!;
  if (last.x !== stop.x || last.y !== stop.y) path.push(stop);
  return { path, firstContact, stop, touchedDynamic, steps, completed: probe.phase === 'idle' };
}
