/**
 * Contrôles partagés par les scripts de salles (`solve-rooms.ts` et
 * `build-pool.ts`) : contraintes de forme, début de salle sain, états de
 * héros attendus à l'entrée de chaque salle et critère « trop facile ».
 *
 * Aucun effet de bord à l'import : ce module n'écrit ni ne lit rien.
 */
import { ENEMIES, PUSHABLES } from '../src/sim/archetypes';
import { Enemy } from '../src/sim/components';
import { HERO_BODY, type HeroCarry, type RoomSpec } from '../src/sim/room';
import { RoomRun } from '../src/sim/rules/turn';
import type { SolverResult } from '../src/sim/solver';
import { circleInsideZone, circleIntersectsZone, pointInZone } from '../src/sim/zones';

/** Plafond du ratio du premier tour pour le tutoriel. */
export const TUTORIAL_MAX_RATIO = 0.5;

export const SANS_POUVOIR: HeroCarry = { hp: 3, charge: 0, form: 'none', element: 'none' };
export const AVEC_PIERRE: HeroCarry = { hp: 3, charge: 0, form: 'pierre', element: 'none' };
export const AVEC_REBOND: HeroCarry = { hp: 3, charge: 0, form: 'rebond', element: 'none' };
export const AVEC_GLU: HeroCarry = { hp: 3, charge: 0, form: 'glu', element: 'none' };
export const AVEC_ELECTRICITE: HeroCarry = { hp: 3, charge: 0, form: 'none', element: 'electricite' };
export const PIERRE_ELECTRICITE: HeroCarry = { hp: 3, charge: 0, form: 'pierre', element: 'electricite' };
export const REBOND_ELECTRICITE: HeroCarry = { hp: 3, charge: 0, form: 'rebond', element: 'electricite' };
export const GLU_ELECTRICITE: HeroCarry = { hp: 3, charge: 0, form: 'glu', element: 'electricite' };

export interface Pass {
  label: string;
  carry: HeroCarry;
}

export interface Entry {
  /** Passes à résoudre : l'état attendu à l'entrée, puis la branche de récupération. */
  passes: Pass[];
  /** Tutoriel : gagnable en un tour, mais le ratio du premier tour doit rester sous 0,5. */
  tutorial?: boolean;
}

/**
 * Entrée des Terrasses : le héros tient toujours l'Électricité, prise à la
 * Herse, et une forme parmi aucune (passé par la Citerne), Pierre, Rebond ou
 * Glu (choisie à la Forge du rempart). Chaque salle terrasse-* doit rester
 * finissable avec les quatre.
 */
export const PASSES_TERRASSES: Pass[] = [
  { label: 'Élec. seule', carry: AVEC_ELECTRICITE },
  { label: 'Pierre + Élec.', carry: PIERRE_ELECTRICITE },
  { label: 'Rebond + Élec.', carry: REBOND_ELECTRICITE },
  { label: 'Glu + Élec.', carry: GLU_ELECTRICITE },
];

/**
 * Carry attendu à l'entrée de chaque salle. Les salles 5 et 6 se jouent aussi
 * sans pouvoir : le joueur qui a pris la branche de récupération (4B) y
 * arrive sans Pierre, et la tranche doit rester finissable.
 */
export const ENTRIES: Record<string, Entry> = {
  'salle-1': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }], tutorial: true },
  'salle-2': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-3': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-4a': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-4b': { passes: [{ label: 'sans pouvoir', carry: SANS_POUVOIR }] },
  'salle-5': {
    passes: [
      { label: 'Pierre', carry: AVEC_PIERRE },
      { label: 'Rebond', carry: AVEC_REBOND },
      { label: 'Glu', carry: AVEC_GLU },
      { label: 'sans pouvoir', carry: SANS_POUVOIR },
    ],
  },
  'salle-6': {
    passes: [
      { label: 'Pierre', carry: AVEC_PIERRE },
      { label: 'Rebond', carry: AVEC_REBOND },
      { label: 'Glu', carry: AVEC_GLU },
      { label: 'Électricité', carry: AVEC_ELECTRICITE },
      { label: 'Pierre + Élec.', carry: PIERRE_ELECTRICITE },
      { label: 'sans pouvoir', carry: SANS_POUVOIR },
    ],
  },
  'terrasse-1': { passes: PASSES_TERRASSES },
  'terrasse-2': { passes: PASSES_TERRASSES },
  'terrasse-3': { passes: PASSES_TERRASSES },
  'terrasse-4a': { passes: PASSES_TERRASSES },
  'terrasse-4b': { passes: PASSES_TERRASSES },
  'terrasse-5': { passes: PASSES_TERRASSES },
  'terrasse-6': { passes: PASSES_TERRASSES },
};

/**
 * Vrai si la salle se gagne trop facilement : le critère du solveur, ou le
 * plafond du tutoriel (gagnable en un tour, mais pas presque au hasard).
 */
export function isTooEasy(result: Pick<SolverResult, 'trivial' | 'firstTurnWinRatio'>, tutorial: boolean): boolean {
  return tutorial ? result.firstTurnWinRatio >= TUTORIAL_MAX_RATIO : result.trivial;
}

/** Contraintes de forme communes à toutes les salles de la tranche. */
export function structuralProblems(spec: RoomSpec): string[] {
  const problems: string[] = [];
  if (spec.width !== 9 || spec.height !== 14) problems.push(`arène ${spec.width}x${spec.height} au lieu de 9x14`);
  if (spec.enemies.length > 3) problems.push(`${spec.enemies.length} ennemis (3 au plus)`);
  if (spec.hazards.length > 2) problems.push(`${spec.hazards.length} gouffres (2 au plus)`);
  if (spec.hero.y < (spec.height * 2) / 3) problems.push('le héros ne démarre pas dans le tiers bas');
  return problems;
}

interface Body {
  label: string;
  x: number;
  y: number;
  r: number;
}

/** Début de salle sain : rien ne se chevauche, rien ne naît dans un gouffre ou une zone de frappe. */
export function startProblems(spec: RoomSpec): string[] {
  const problems: string[] = [];
  const bodies: Body[] = [
    { label: 'héros', x: spec.hero.x, y: spec.hero.y, r: HERO_BODY.radius },
    ...spec.enemies.map((e, i) => ({ label: `ennemi ${i} (${e.archetype})`, x: e.x, y: e.y, r: ENEMIES[e.archetype].radius })),
    ...spec.pushables.map((p, i) => ({ label: `poussable ${i} (${p.kind})`, x: p.x, y: p.y, r: PUSHABLES[p.kind].radius })),
  ];
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i]!;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j]!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) problems.push(`${a.label} chevauche ${b.label}`);
    }
    for (const [k, box] of spec.boxes.entries()) {
      const qx = Math.max(box.x - box.width / 2, Math.min(a.x, box.x + box.width / 2));
      const qy = Math.max(box.y - box.height / 2, Math.min(a.y, box.y + box.height / 2));
      if (Math.hypot(a.x - qx, a.y - qy) < a.r) problems.push(`${a.label} chevauche la boîte ${k}`);
    }
    for (const hazard of spec.hazards) {
      if (pointInZone(a.x, a.y, hazard.zone)) problems.push(`${a.label} naît dans un gouffre`);
    }
  }
  const run = RoomRun.fromSpec(spec);
  for (const entity of run.enemies()) {
    const intent = run.sim.world.require(entity, Enemy).intent;
    for (const zone of intent?.zones ?? []) {
      if (circleIntersectsZone(spec.hero.x, spec.hero.y, HERO_BODY.radius, zone)) problems.push('le héros démarre dans une zone de frappe annoncée');
    }
  }
  if (spec.objective.type === 'push') {
    const object = spec.pushables[spec.objective.object]!;
    const goal = { kind: 'disc', ...spec.objective.goal } as const;
    if (circleInsideZone(object.x, object.y, PUSHABLES[object.kind].radius, goal)) problems.push('l\'objet poussable démarre déjà dans la cible');
  }
  return problems;
}
