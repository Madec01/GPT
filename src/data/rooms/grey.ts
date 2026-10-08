import type { RoomSpec } from '../../sim/room';

/**
 * Salle grise : arène d'essai sans narration. Un crapaud, une gelée, un
 * rocailleux, deux caisses et une barricade. Sert aux tests de déterminisme,
 * aux rejeux dorés et au mode test.
 */
export const GREY_ROOM: RoomSpec = {
  id: 'grey',
  name: 'Salle grise',
  width: 9,
  height: 14,
  seed: 1,
  wallRestitution: 0.7,
  hero: { x: 4.5, y: 11.5 },
  enemies: [
    { archetype: 'crapaud', x: 2.5, y: 4.5 },
    { archetype: 'gelee', x: 6.5, y: 5.5 },
    { archetype: 'rocailleux', x: 4.5, y: 7.5 },
  ],
  pushables: [],
  boxes: [
    { x: 1.75, y: 9, width: 1, height: 1, breakable: 'crate' },
    { x: 7.25, y: 9.5, width: 1, height: 1, breakable: 'crate' },
    { x: 4.5, y: 2.5, width: 3, height: 0.5, breakable: 'barricade' },
    { x: 8.5, y: 6.5, width: 0.6, height: 1.6, bouncy: true },
    { x: 1.5, y: 5.5, width: 0.9, height: 0.9, breakable: 'explosive' },
  ],
  springboards: [],
  hazards: [],
  objective: { type: 'eliminate' },
};
