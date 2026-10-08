/**
 * Contrats secondaires : un défi optionnel par salle, affiché sous
 * l'objectif, évalué à la victoire. Fonctions pures sur l'état de salle.
 */
import type { Hero, RoomState } from './components';

export type ContractReward = 'coeur' | 'charge';

export type ContractSpec =
  | { type: 'sansDegat'; reward: ContractReward }
  | { type: 'tours'; max: number; reward: ContractReward }
  | { type: 'casse'; count: number; reward: ContractReward }
  | { type: 'sonnes'; count: number; reward: ContractReward };

/** Vrai si le contrat est rempli dans l'état donné, à la victoire. */
export function contractFulfilled(spec: ContractSpec, state: RoomState): boolean {
  switch (spec.type) {
    case 'sansDegat':
      return state.heroHits === 0;
    case 'tours':
      return state.turn <= spec.max;
    case 'casse':
      return state.breaks >= spec.count;
    case 'sonnes':
      return state.bestStuns >= spec.count;
  }
}

/** Vrai dès que le contrat ne peut plus être rempli dans cette salle. */
export function contractBroken(spec: ContractSpec, state: RoomState): boolean {
  switch (spec.type) {
    case 'sansDegat':
      return state.heroHits > 0;
    case 'tours':
      return state.turn > spec.max;
    case 'casse':
    case 'sonnes':
      return false;
  }
}

/**
 * Ligne d'interface : l'énoncé, puis l'avancement ou la rupture. Les contrats
 * à compteur affichent une coche dès que la cible est atteinte ; les autres ne
 * se jugent qu'à la victoire.
 */
export function contractLabel(spec: ContractSpec, state: RoomState): string {
  const goal = contractGoal(spec);
  if (contractBroken(spec, state)) return `Contrat rompu : ${goal}`;
  switch (spec.type) {
    case 'casse':
      return `Contrat : ${goal} (${state.breaks}/${spec.count})${state.breaks >= spec.count ? ' ✓' : ''}`;
    case 'sonnes':
      return `Contrat : ${goal} (${state.bestStuns}/${spec.count})${state.bestStuns >= spec.count ? ' ✓' : ''}`;
    default:
      return `Contrat : ${goal}`;
  }
}

export function contractGoal(spec: ContractSpec): string {
  switch (spec.type) {
    case 'sansDegat':
      return 'sans dégât';
    case 'tours':
      return `en ${spec.max} tour${spec.max > 1 ? 's' : ''} au plus`;
    case 'casse':
      return `briser ${spec.count} cassable${spec.count > 1 ? 's' : ''}`;
    case 'sonnes':
      return `sonner ${spec.count} ennemis d'un lancer`;
  }
}

export function rewardLabel(reward: ContractReward): string {
  return reward === 'coeur' ? 'un cœur rendu' : 'la jauge remplie';
}

/** Applique la récompense au héros ; un cœur de trop est perdu. */
export function applyContractReward(reward: ContractReward, hero: Hero): void {
  if (reward === 'coeur') hero.hp = Math.min(hero.maxHp, hero.hp + 1);
  else hero.charge = hero.chargeMax;
}
