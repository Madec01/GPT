/**
 * Pouvoirs de Dodu : trois formes et un élément, leurs versions fortes et
 * leurs synergies. Les descriptions servent aux écrans de choix.
 */
import { DEFAULT_MODIFIERS, type RunModifiers } from '../modifiers';
import type { Entity, World } from '../../core/ecs/world';
import type { CircleBody} from '../../core/physics';
import { SegmentOwner, Transform, Velocity } from '../../core/physics';
import { RULES } from '../archetypes';
import { Breakable, Enemy, Hero, type HeroElement, type HeroForm } from '../components';
import { HERO_BODY } from '../room';

export interface PowerCard {
  id: HeroForm | HeroElement;
  kind: 'forme' | 'element';
  name: string;
  description: string;
  strong: string;
}

export const FORM_CARDS: readonly PowerCard[] = [
  {
    id: 'pierre',
    kind: 'forme',
    name: 'Pierre',
    description: 'Forme lourde. Dodu pousse plus fort et s\'arrête plus tôt.',
    strong: 'Boulet de siège : masse triple, le premier obstacle cède, les rocailleux partent à pleine vitesse.',
  },
  {
    id: 'rebond',
    kind: 'forme',
    name: 'Rebond',
    description: 'Forme rebondissante. Rebonds vifs ; lancé assez vite, Dodu saute par-dessus les caisses.',
    strong: 'Version forte : il franchit aussi barricades et colonnes.',
  },
  {
    id: 'glu',
    kind: 'forme',
    name: 'Glu',
    description: 'Forme gluante. Dodu s\'ancre au premier mur touché et s\'y arrête net.',
    strong: 'Version forte : il s\'accroche aussi au premier ennemi frappé.',
  },
];

export const ELEMENT_CARD: PowerCard = {
  id: 'electricite',
  kind: 'element',
  name: 'Électricité',
  description: 'Chaque ennemi blessé foudroie ses voisins proches.',
  strong: 'Version forte : la chaîne saute d\'ennemi en ennemi, deux sauts au plus.',
};

/** Ligne de synergie entre l'élément et une forme, pour l'écran de choix. */
export function synergyLine(form: HeroForm, element: HeroElement): string | null {
  if (element !== 'electricite') return null;
  switch (form) {
    case 'pierre':
      return 'Avec Pierre : les arcs du Boulet de siège infligent deux points.';
    case 'rebond':
      return 'Avec Rebond : arcs plus larges.';
    case 'glu':
      return 'Avec Glu : ancré sur un ennemi en version forte, l\'arc frappe tout autour.';
    case 'none':
      return null;
  }
}

export function formName(form: HeroForm): string {
  return FORM_CARDS.find((c) => c.id === form)?.name ?? 'Aucune';
}

/** Vrai si Dodu tient au moins un pouvoir : la jauge de charge n'existe qu'alors. */
export function hasAnyPower(hero: Hero): boolean {
  return hero.form !== 'none' || hero.element !== 'none';
}

/** Masse et rebond du héros au moment du lancer, selon la forme et la version forte. */
export function applyFormToBody(hero: Hero, body: CircleBody, mods: RunModifiers = DEFAULT_MODIFIERS): void {
  switch (hero.form) {
    case 'pierre':
      body.mass = hero.strongThrow ? RULES.pierreStrongMass : RULES.pierreWeakMass;
      body.restitution = RULES.pierreWeakRestitution;
      break;
    case 'rebond':
      body.mass = HERO_BODY.mass;
      body.restitution = RULES.rebondRestitution;
      break;
    case 'glu':
    case 'none':
      body.mass = HERO_BODY.mass;
      body.restitution = HERO_BODY.restitution;
      break;
  }
  body.mass *= mods.heroMassScale;
  if (mods.heroRestitution !== null) body.restitution = mods.heroRestitution;
}

/**
 * Filtre de collision de la forme rebondissante : lancé assez vite, Dodu
 * ignore les faces des caisses ; en version forte, celles de tous les
 * cassables. Fonction pure du monde, donc déterministe et prédictible.
 */
export function passOverFilter(world: World, dynamic: Entity, segment: Entity): boolean {
  const hero = world.get(dynamic, Hero);
  if (!hero || hero.form !== 'rebond') return true;
  const owner = world.get(segment, SegmentOwner)?.owner;
  if (owner === undefined) return true;
  const breakable = world.get(owner, Breakable);
  if (!breakable) return true;
  if (breakable.breakableKind !== 'crate' && !hero.strongThrow) return true;
  const v = world.require(dynamic, Velocity);
  return v.x * v.x + v.y * v.y < RULES.rebondPassSpeed * RULES.rebondPassSpeed;
}

/** Rayon des arcs électriques selon la forme, la version forte et l'ancrage. */
export function arcRadius(hero: Hero): number {
  if (hero.form === 'glu' && hero.strongThrow && hero.anchoredOnEnemy) return RULES.arcRadiusGluAnchored;
  if (hero.form === 'rebond') return RULES.arcRadiusRebond;
  return RULES.arcRadius;
}

export function arcDamage(hero: Hero): number {
  return hero.form === 'pierre' && hero.strongThrow ? RULES.arcDamagePierreStrong : RULES.arcDamage;
}

/**
 * Ennemis foudroyés depuis un impact : les voisins de l'ennemi frappé, puis,
 * en version forte, les voisins des voisins, chaque ennemi une seule fois.
 * Renvoie les paires origine → cible, dans un ordre déterministe.
 */
export function arcTargets(world: World, hero: Hero, hit: Entity, originX: number, originY: number): Array<{ from: { x: number; y: number }; to: Entity }> {
  const radius = arcRadius(hero);
  const hops = hero.strongThrow ? RULES.arcHopsStrong : 1;
  const visited = new Set<Entity>([hit]);
  const result: Array<{ from: { x: number; y: number }; to: Entity }> = [];
  let frontier: Array<{ x: number; y: number }> = [{ x: originX, y: originY }];
  for (let hop = 0; hop < hops && frontier.length > 0; hop++) {
    const next: Array<{ x: number; y: number }> = [];
    for (const from of frontier) {
      for (const enemy of world.query(Enemy, Transform)) {
        if (visited.has(enemy)) continue;
        const t = world.require(enemy, Transform);
        const dx = t.x - from.x;
        const dy = t.y - from.y;
        if (dx * dx + dy * dy > radius * radius) continue;
        visited.add(enemy);
        result.push({ from, to: enemy });
        next.push({ x: t.x, y: t.y });
      }
    }
    frontier = next;
  }
  return result;
}
