/**
 * Modificateurs de run : ce que les charmes et les élites changent aux règles.
 * Données simples portées par l'état de salle, donc clonées avec lui, prédites
 * par l'aide à la visée et vues du solveur.
 */
import { RULES } from './archetypes';

export interface RunModifiers {
  /** Cœurs maximum de Dodu. */
  maxHp: number;
  /** Multiplicateur de la masse de Dodu au lancer. */
  heroMassScale: number;
  /** Rebond imposé à Dodu quelle que soit sa forme, ou null pour celui de la forme. */
  heroRestitution: number | null;
  /** Vitesse à partir de laquelle une caisse ou un explosif cède. */
  crateBreakSpeed: number;
  /** Déplacement qui sonne un ennemi. */
  stunDisplacement: number;
  /** Lancers par tour avant la frappe des ennemis. */
  throwsPerTurn: number;
  /** Chaque rebond de mur ajoute un point au prochain impact de Dodu. */
  wallBounceBonus: boolean;
  /** Points ajoutés au premier impact de chaque lancer. */
  firstImpactBonus: number;
  /** Le premier coup reçu dans la salle est annulé. */
  firstHitShield: boolean;
  /** Points ajoutés aux projectiles, rocailleux et rochers. */
  projectileBonus: number;
  /** Rebonds de mur pour remplir la jauge. */
  chargeMax: number;
  /** Points de vie ajoutés à chaque ennemi, salles d'élite. */
  enemyHpBonus: number;
}

export const DEFAULT_MODIFIERS: RunModifiers = {
  maxHp: RULES.heroMaxHp,
  heroMassScale: 1,
  heroRestitution: null,
  crateBreakSpeed: RULES.crateBreakSpeed,
  stunDisplacement: RULES.stunDisplacement,
  throwsPerTurn: 1,
  wallBounceBonus: false,
  firstImpactBonus: 0,
  firstHitShield: false,
  projectileBonus: 0,
  chargeMax: RULES.chargeMax,
  enemyHpBonus: 0,
};
