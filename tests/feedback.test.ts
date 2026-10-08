import { describe, expect, it } from 'vitest';
import { enemyExpression, heroExpression } from '../src/app/expressions';
import { comboSemitones, cueForWallBounce, cuesForEvent, PENTATONIC } from '../src/audio/cues';
import { squashEnvelope, squashScales } from '../src/render/tween';

describe('expressions', () => {
  it('suit la phase et le marqueur', () => {
    const base = { phase: 'aim' as const, aiming: false, marker: 'safe' as const, sinceImpact: Infinity, sinceHit: Infinity };
    expect(heroExpression(base)).toBe('neutral');
    expect(heroExpression({ ...base, aiming: true })).toBe('aim');
    expect(heroExpression({ ...base, aiming: true, marker: 'danger' })).toBe('worried');
    expect(heroExpression({ ...base, phase: 'moving' })).toBe('flight');
    expect(heroExpression({ ...base, phase: 'moving', sinceImpact: 0.05 })).toBe('impact');
    expect(heroExpression({ ...base, sinceHit: 0.5 })).toBe('hit');
    expect(heroExpression({ ...base, phase: 'won' })).toBe('happy');
    expect(heroExpression({ ...base, phase: 'lost' })).toBe('hit');
    expect(enemyExpression(true, Infinity)).toBe('stunned');
    expect(enemyExpression(false, 0.1)).toBe('hit');
    expect(enemyExpression(false, 5)).toBe('neutral');
  });
});

describe('sons', () => {
  it('monte en gamme pentatonique à chaque impact, plafonnée', () => {
    expect([0, 1, 2, 3].map(comboSemitones)).toEqual([0, 2, 4, 7]);
    expect(comboSemitones(99)).toBe(PENTATONIC[PENTATONIC.length - 1]);
    const cues = cuesForEvent({ type: 'damage', entity: 1, amount: 1, x: 0, y: 0 }, 2);
    expect(cues.map((c) => c.key)).toEqual(['bounceEnemy', 'note']);
    expect(cues[1]!.semitones).toBe(4);
  });

  it('distingue les casses et ignore les contacts trop faibles', () => {
    expect(cuesForEvent({ type: 'break', entity: 1, breakableKind: 'column', x: 0, y: 0 }, 0)[0]!.key).toBe('columnBreak');
    expect(cuesForEvent({ type: 'death', entity: 1, kind: 'crapaud', x: 0, y: 0 }, 0)[0]!.key).toBe('crapaudBurst');
    expect(cueForWallBounce(1)).toBeNull();
    expect(cueForWallBounce(14)!.volume).toBe(1);
    expect(cuesForEvent({ type: 'turn', turn: 2 }, 0)).toEqual([]);
    expect(cuesForEvent({ type: 'crack', entity: 1, remaining: 2, x: 0, y: 0 }, 0)[0]!.key).toBe('impactHeavy');
    expect(cuesForEvent({ type: 'explosion', x: 0, y: 0, r: 2 }, 0)[0]).toMatchObject({ key: 'columnBreak', semitones: -5 });
  });
});

describe('écrasement', () => {
  it('part de 1, passe en négatif, revient à 0', () => {
    expect(squashEnvelope(0)).toBe(1);
    expect(squashEnvelope(0.13)).toBeLessThan(0);
    expect(squashEnvelope(0.18)).toBe(0);
    expect(squashEnvelope(1)).toBe(0);
    const { along, across } = squashScales(1, 0.3);
    expect(along).toBeCloseTo(0.7, 9);
    expect(across).toBeGreaterThan(1);
  });
});
