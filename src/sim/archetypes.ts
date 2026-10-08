/**
 * Fiches des corps de jeu, valeurs initiales du GDD. Les personnalités sont
 * des règles de contact nommées, pas seulement des masses.
 */
export type Archetype = 'crapaud' | 'gelee' | 'rocailleux' | 'boss';
export type Personality = 'bumper' | 'sticky' | 'heavy' | 'boss';
export type PushableKind = 'egg' | 'boulder';
/** Rôle posé sur un ennemi ordinaire, qui garde sa personnalité physique. */
export type EnemyRole = 'none' | 'guerisseur' | 'artificier' | 'batisseur';

export interface EnemyProfile {
  radius: number;
  mass: number;
  restitution: number;
  rollingDecel: number;
  hp: number;
  personality: Personality;
  /** Rayon de la zone de frappe, ou rayon de chaque disque pour le boss. */
  zoneRadius: number;
}

export const ENEMIES: Record<Archetype, EnemyProfile> = {
  crapaud: { radius: 0.5, mass: 0.6, restitution: 0.95, rollingDecel: 6, hp: 2, personality: 'bumper', zoneRadius: 2 },
  gelee: { radius: 0.5, mass: 1, restitution: 0, rollingDecel: 6, hp: 2, personality: 'sticky', zoneRadius: 1.5 },
  rocailleux: { radius: 0.6, mass: 3, restitution: 0.3, rollingDecel: 6, hp: 3, personality: 'heavy', zoneRadius: 1.2 },
  boss: { radius: 1.2, mass: 12, restitution: 0.2, rollingDecel: 10, hp: 6, personality: 'boss', zoneRadius: 0.9 },
};

export interface PushableProfile {
  radius: number;
  mass: number;
  restitution: number;
  rollingDecel: number;
}

export const PUSHABLES: Record<PushableKind, PushableProfile> = {
  egg: { radius: 0.45, mass: 1.2, restitution: 0.5, rollingDecel: 6 },
  boulder: { radius: 0.5, mass: 1.2, restitution: 0.4, rollingDecel: 6 },
};

/** Seuils de règles, valeurs initiales du GDD. */
export const RULES = {
  /** Vitesse minimale pour blesser à l'impact. */
  damageMinSpeed: 3,
  /** Vitesse minimale pour briser une caisse. */
  crateBreakSpeed: 4,
  /** Vitesse d'éclatement du crapaud contre un mur ou un ennemi. */
  crapaudBurstSpeed: 6,
  /** Vitesse à partir de laquelle un rocailleux ou un boulet devient un projectile. */
  projectileSpeed: 4,
  heroDamage: 1,
  projectileDamage: 2,
  /** Dégâts d'un boulet projeté sur tout ennemi, boss compris. */
  boulderDamage: 2,
  columnDamageToBoss: 2,
  strongDirectDamageToBoss: 1,
  /** Déplacement minimal, en unités, pour sonner un ennemi. */
  stunDisplacement: 1,
  /** Rebonds de mur nécessaires pour remplir la charge, et vitesse minimale de chaque rebond. */
  chargeMax: 3,
  chargeMinSpeed: 2,
  /** Chance qu'une caisse brisée libère un cœur. */
  heartChance: 1 / 3,
  heroMaxHp: 3,
  /** Impulsion d'un tremplin, en unités par seconde. */
  springImpulse: 6,
  /** Pouvoir Pierre. */
  pierreWeakMass: 1.5,
  pierreWeakRestitution: 0.6,
  pierreStrongMass: 3,
  /** Facteur de vitesse rendue par un bumper. */
  bumperReturn: 0.95,
  /** Forme rebondissante. */
  rebondRestitution: 0.95,
  rebondPassSpeed: 4,
  /** Électricité. */
  arcRadius: 1.8,
  arcRadiusRebond: 2.4,
  arcRadiusGluAnchored: 3,
  arcDamage: 1,
  arcDamagePierreStrong: 2,
  arcHopsStrong: 2,
  /** Décor actif. */
  springRestitution: 1.3,
  explosionRadius: 2,
  explosionDamageEnemy: 2,
  explosionDamageHero: 1,
  explosionImpulse: 8,
  /** Solidité des cassables : nombre d'impacts à 3 unités par seconde ou plus avant rupture. */
  solidity: { crate: 1, explosive: 1, barricade: 3, column: 3 } as Record<string, number>,
  /** Boucliers et rôles. */
  shieldReturn: 0.9,
  healerZoneRadius: 1,
  healerAmount: 1,
  /** Zone de pose des artificiers et bâtisseurs : devant eux, à portée, de ce rayon. */
  placeZoneRadius: 0.9,
  placedBoxSize: 0.8,
  /** Poses au plus par genre et par salle, quelles que soient les boîtes déjà présentes ou brisées. */
  maxPlacedBoxes: 3,
  rolesPerRoom: 2,
} as const;
