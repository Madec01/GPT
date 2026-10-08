/**
 * Correspondance pure entre les événements de règles et les sons à jouer.
 * Testable en Node ; aucune dépendance au navigateur.
 */
import type { RuleEvent } from '../sim/components';

export interface SoundCue {
  key: string;
  volume: number;
  /** Transposition en demi-tons, appliquée par le moteur audio. */
  semitones: number;
}

/** Gamme pentatonique majeure sur deux octaves, en demi-tons. */
export const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24] as const;

/** Demi-tons de la note d'un combo, plafonnés au dernier degré. */
export function comboSemitones(index: number): number {
  const i = Math.max(0, Math.min(PENTATONIC.length - 1, index));
  return PENTATONIC[i]!;
}

function speedVolume(impactSpeed: number, floor = 0.35): number {
  return Math.min(1, floor + impactSpeed / 14);
}

/**
 * Sons pour un événement de règles. `comboIndex` compte les impacts du lancer
 * en cours, pour la gamme montante. Plusieurs sons peuvent répondre à un
 * même événement.
 */
export function cuesForEvent(event: RuleEvent, comboIndex: number): SoundCue[] {
  switch (event.type) {
    case 'damage':
      return [
        { key: 'bounceEnemy', volume: 0.8, semitones: 0 },
        { key: 'note', volume: 0.6, semitones: comboSemitones(comboIndex) },
      ];
    case 'death':
      return [{ key: event.kind === 'crapaud' ? 'crapaudBurst' : 'enemyDeath', volume: 1, semitones: 0 }];
    case 'break':
      return [
        {
          key: event.breakableKind === 'crate' ? 'crateBreak' : event.breakableKind === 'barricade' ? 'barricadeBreak' : 'columnBreak',
          volume: 1,
          semitones: 0,
        },
      ];
    case 'bumper':
      return [{ key: 'bumper', volume: 0.9, semitones: 0 }];
    case 'stick':
      return [{ key: 'stick', volume: 0.9, semitones: 0 }];
    case 'charge':
      return [{ key: 'chargeUp', volume: 0.7, semitones: (event.value - 1) * 4 }];
    case 'spring':
      return [{ key: 'spring', volume: 0.9, semitones: 0 }];
    case 'fall':
      return [{ key: 'fall', volume: 0.9, semitones: 0 }];
    case 'heal':
      return [{ key: 'heal', volume: 0.9, semitones: 0 }];
    case 'heroHit':
      return [{ key: 'heroHit', volume: 1, semitones: 0 }];
    case 'stun':
      return [{ key: 'stun', volume: 0.7, semitones: 0 }];
    case 'arc':
      return [{ key: 'chargeUp', volume: 0.8, semitones: 9 }];
    case 'anchor':
      return [{ key: 'stick', volume: 0.8, semitones: 3 }];
    case 'crack':
      return [{ key: 'impactHeavy', volume: 0.8, semitones: 0 }];
    case 'explosion':
      return [{ key: 'columnBreak', volume: 1, semitones: -5 }];
    case 'shield':
      return [{ key: 'bumper', volume: 0.9, semitones: -4 }];
    case 'enemyHeal':
      return [{ key: 'heal', volume: 0.6, semitones: -3 }];
    case 'place':
      return [{ key: 'impactHeavy', volume: 0.5, semitones: -2 }];
    case 'contract':
      return event.done ? [{ key: 'heal', volume: 0.9, semitones: 7 }] : [];
    case 'replay':
      return [{ key: 'chargeUp', volume: 0.8, semitones: 12 }];
    case 'blocked':
      return [{ key: 'bumper', volume: 0.7, semitones: 2 }];
    case 'revive':
      return [{ key: 'heal', volume: 1, semitones: 12 }];
    case 'move':
      return [];
    case 'won':
      return [{ key: 'win', volume: 1, semitones: 0 }];
    case 'lost':
      return [{ key: 'lose', volume: 1, semitones: 0 }];
    case 'loot':
    case 'turn':
      return [];
  }
}

/** Son d'un contact physique sans règle associée : rebond sur un mur ou une boîte. */
export function cueForWallBounce(impactSpeed: number): SoundCue | null {
  if (impactSpeed < 1.5) return null;
  return { key: 'bounceWall', volume: speedVolume(impactSpeed), semitones: 0 };
}

export function cueForHeavyImpact(impactSpeed: number): SoundCue | null {
  if (impactSpeed < 3) return null;
  return { key: 'impactHeavy', volume: speedVolume(impactSpeed, 0.5), semitones: 0 };
}
