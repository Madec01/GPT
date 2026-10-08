import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { RoomSpecError, validateRoomSpec } from '../src/data/schema';

describe('validateRoomSpec', () => {
  it('accepte la salle grise et la renvoie à l\'identique', () => {
    const parsed = validateRoomSpec(JSON.parse(JSON.stringify(GREY_ROOM)), 'grey');
    expect(parsed).toEqual(GREY_ROOM);
  });

  it('nomme le chemin fautif', () => {
    const bad = { ...GREY_ROOM, enemies: [{ archetype: 'crapaud', x: 20, y: 1 }] };
    expect(() => validateRoomSpec(bad, 'grey')).toThrow(RoomSpecError);
    expect(() => validateRoomSpec(bad, 'grey')).toThrow(/grey\.enemies\[0\] : corps hors de l'arène/);
    expect(() => validateRoomSpec({ ...GREY_ROOM, id: '' })).toThrow(/salle\.id/);
    expect(() => validateRoomSpec({ ...GREY_ROOM, objective: { type: 'push', object: 0, goal: { x: 1, y: 1, r: 1 } } })).toThrow(
      /objective\.object/,
    );
    expect(() =>
      validateRoomSpec({ ...GREY_ROOM, boxes: [{ x: 4, y: 4, width: 1, height: 1, breakable: 'crate', collapse: { kind: 'disc', x: 4, y: 4, r: 1 } }] }),
    ).toThrow(/collapse : réservé aux colonnes/);
    const pit = { kind: 'pit', zone: { kind: 'disc', x: 1, y: 1, r: 0.5 } };
    expect(() => validateRoomSpec({ ...GREY_ROOM, hazards: [pit, pit, pit] })).toThrow(/deux zones dangereuses/);
  });
});
