/**
 * Choix pur de l'expression de Dodu et des ennemis à partir de l'état de jeu.
 * Les minuteries sont tenues par l'application et passées en secondes.
 */
import type { Expression, HeroExpression } from '../render/assets';
import type { MarkerState } from '../render/pixiRenderer';

export interface HeroMood {
  phase: 'aim' | 'moving' | 'won' | 'lost';
  aiming: boolean;
  marker: MarkerState;
  /** Secondes depuis le dernier choc de Dodu, ou Infinity. */
  sinceImpact: number;
  /** Secondes depuis que Dodu a été frappé par une zone, ou Infinity. */
  sinceHit: number;
}

export function heroExpression(mood: HeroMood): HeroExpression {
  if (mood.phase === 'lost') return 'hit';
  if (mood.phase === 'won') return 'happy';
  if (mood.sinceHit < 1.2) return 'hit';
  if (mood.phase === 'moving') return mood.sinceImpact < 0.15 ? 'impact' : 'flight';
  if (mood.aiming) return mood.marker === 'danger' ? 'worried' : 'aim';
  return mood.sinceHit < 2.5 ? 'worried' : 'neutral';
}

export function enemyExpression(stunned: boolean, sinceDamage: number): Expression {
  if (stunned) return 'stunned';
  if (sinceDamage < 0.3) return 'hit';
  return 'neutral';
}
