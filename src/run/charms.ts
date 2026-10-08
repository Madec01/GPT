/**
 * Charmes : reliques passives du run. Chacun se traduit en modificateurs de
 * règles pour la simulation, ou en effet côté run (plumes, aide à la visée,
 * seconde vie). Données pures, testables en Node.
 */
import { DEFAULT_MODIFIERS, type RunModifiers } from '../sim/modifiers';

export type CharmRarity = 'commun' | 'rare';

export type CharmId =
  | 'bille-de-verre'
  | 'plume-de-plomb'
  | 'grelot'
  | 'corde-double'
  | 'ricochet-d-or'
  | 'oeuf-de-secours'
  | 'mors-de-fer'
  | 'bouclier-de-plumes'
  | 'aimant-a-plumes'
  | 'pierre-a-aiguiser'
  | 'tambour-de-guerre'
  | 'lanterne';

export interface CharmDef {
  id: CharmId;
  name: string;
  description: string;
  rarity: CharmRarity;
}

export const MAX_CHARMS = 6;

export const CHARM_PRICES: Record<CharmRarity, number> = { commun: 50, rare: 80 };

export const CHARMS: readonly CharmDef[] = [
  { id: 'bille-de-verre', name: 'Bille de verre', description: 'Le rebond de Dodu vaut 0,95, quelle que soit sa forme.', rarity: 'commun' },
  { id: 'plume-de-plomb', name: 'Plume de plomb', description: 'Masse doublée ; les caisses cèdent dès 3 unités par seconde.', rarity: 'rare' },
  { id: 'grelot', name: 'Grelot', description: 'Un ennemi est sonné dès un demi-pas de déplacement.', rarity: 'commun' },
  { id: 'corde-double', name: 'Corde double', description: 'Deux lancers par tour ; les ennemis ne frappent qu\'après le second.', rarity: 'rare' },
  { id: 'ricochet-d-or', name: 'Ricochet d\'or', description: 'Chaque rebond de mur ajoute un point au prochain impact.', rarity: 'commun' },
  { id: 'oeuf-de-secours', name: 'Œuf de secours', description: 'Une mort annulée par run : Dodu se relève avec un cœur.', rarity: 'rare' },
  { id: 'mors-de-fer', name: 'Mors de fer', description: 'Le premier impact de chaque lancer inflige un point de plus.', rarity: 'commun' },
  { id: 'bouclier-de-plumes', name: 'Bouclier de plumes', description: 'Le premier coup reçu dans chaque salle est annulé.', rarity: 'commun' },
  { id: 'aimant-a-plumes', name: 'Aimant à plumes', description: 'Plumes d\'or gagnées augmentées de moitié.', rarity: 'commun' },
  { id: 'pierre-a-aiguiser', name: 'Pierre à aiguiser', description: 'Projectiles, rocailleux et rochers, un point de plus.', rarity: 'commun' },
  { id: 'tambour-de-guerre', name: 'Tambour de guerre', description: 'La jauge se remplit en deux rebonds au lieu de trois.', rarity: 'rare' },
  { id: 'lanterne', name: 'Lanterne', description: 'L\'aide à la visée montre le trajet complet.', rarity: 'commun' },
];

const BY_ID = new Map(CHARMS.map((c) => [c.id, c]));

export function isCharmId(value: unknown): value is CharmId {
  return typeof value === 'string' && BY_ID.has(value as CharmId);
}

export function charmById(id: CharmId): CharmDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Charme inconnu : ${id}`);
  return def;
}

export function charmPrice(id: CharmId): number {
  return CHARM_PRICES[charmById(id).rarity];
}

/** Règles de simulation pour un jeu de charmes, des cœurs maximum et une salle d'élite ou non. */
export function modifiersFor(charms: readonly CharmId[], maxHp: number, elite = false): RunModifiers {
  const has = (id: CharmId): boolean => charms.includes(id);
  return {
    ...DEFAULT_MODIFIERS,
    maxHp,
    heroMassScale: has('plume-de-plomb') ? 2 : 1,
    heroRestitution: has('bille-de-verre') ? 0.95 : null,
    crateBreakSpeed: has('plume-de-plomb') ? 3 : DEFAULT_MODIFIERS.crateBreakSpeed,
    stunDisplacement: has('grelot') ? 0.5 : DEFAULT_MODIFIERS.stunDisplacement,
    throwsPerTurn: has('corde-double') ? 2 : 1,
    wallBounceBonus: has('ricochet-d-or'),
    firstImpactBonus: has('mors-de-fer') ? 1 : 0,
    firstHitShield: has('bouclier-de-plumes'),
    projectileBonus: has('pierre-a-aiguiser') ? 1 : 0,
    chargeMax: has('tambour-de-guerre') ? 2 : DEFAULT_MODIFIERS.chargeMax,
    enemyHpBonus: elite ? 1 : 0,
  };
}

export function plumesMultiplier(charms: readonly CharmId[]): number {
  return charms.includes('aimant-a-plumes') ? 1.5 : 1;
}

export function showsFullPath(charms: readonly CharmId[]): boolean {
  return charms.includes('lanterne');
}
