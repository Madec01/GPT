import { describe, expect, it } from 'vitest';
import { AimGesture, aimFromPoints, DEFAULT_GESTURE } from '../src/input/gesture';

describe('aimFromPoints', () => {
  it('n\'arme rien dans la zone morte', () => {
    const aim = aimFromPoints(100, 100, 110, 100);
    expect(aim.active).toBe(true);
    expect(aim.armed).toBe(false);
    expect(aim.power).toBe(0);
  });

  it('lance à l\'opposé du glissement, puissance proportionnelle et plafonnée', () => {
    const half = DEFAULT_GESTURE.deadZone + (DEFAULT_GESTURE.maxRadius - DEFAULT_GESTURE.deadZone) / 2;
    const aim = aimFromPoints(100, 100, 100, 100 + half);
    expect(aim.armed).toBe(true);
    expect(aim.dirX).toBeCloseTo(0, 12);
    expect(aim.dirY).toBeCloseTo(-1, 12);
    expect(aim.power).toBeCloseTo(0.5, 12);
    expect(aimFromPoints(100, 100, 100, 1000).power).toBe(1);
  });
});

describe('AimGesture', () => {
  it('suit un seul pointeur, ignore les autres, et tire au relâcher', () => {
    const g = new AimGesture();
    expect(g.handle({ type: 'down', id: 1, x: 50, y: 50 })?.type).toBe('aim');
    expect(g.handle({ type: 'down', id: 2, x: 0, y: 0 })).toBeNull();
    expect(g.handle({ type: 'move', id: 2, x: 0, y: 0 })).toBeNull();
    expect(g.handle({ type: 'move', id: 1, x: 150, y: 50 })?.type).toBe('aim');
    const release = g.handle({ type: 'up', id: 1, x: 150, y: 50 });
    expect(release).toMatchObject({ type: 'throw', dirX: -1, dirY: 0 });
    expect(g.active).toBe(false);
  });

  it('annule si le doigt revient dans la zone morte ou si le pointeur est perdu', () => {
    const g = new AimGesture();
    g.handle({ type: 'down', id: 1, x: 50, y: 50 });
    g.handle({ type: 'move', id: 1, x: 150, y: 50 });
    g.handle({ type: 'move', id: 1, x: 55, y: 50 });
    expect(g.handle({ type: 'up', id: 1, x: 55, y: 50 })).toEqual({ type: 'cancel' });
    g.handle({ type: 'down', id: 3, x: 50, y: 50 });
    expect(g.handle({ type: 'cancel', id: 3, x: 0, y: 0 })).toEqual({ type: 'cancel' });
    expect(g.active).toBe(false);
  });
});
