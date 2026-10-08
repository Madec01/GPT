import { HERO_BODY, type RoomSpec } from '../../sim/room';

/**
 * Salle grise de la phase 1 : aucune règle de jeu, seulement de quoi lancer,
 * rebondir et percuter. Les trois cercles inertes préfigurent le crapaud
 * (léger, très rebondissant), la gelée (masse normale, rebond nul) et le
 * rocailleux (masse triple, rebond faible), sans leurs règles de contact.
 */
export const GREY_ROOM: RoomSpec = {
  id: 'grey',
  name: 'Salle grise',
  width: 9,
  height: 14,
  seed: 1,
  wallRestitution: 0.7,
  hero: { ...HERO_BODY, x: 4.5, y: 11.5 },
  circles: [
    { kind: 'dummy-light', x: 2.5, y: 4.5, radius: 0.5, mass: 0.6, restitution: 0.95, rollingDecel: 6 },
    { kind: 'dummy-soft', x: 6.5, y: 5.5, radius: 0.5, mass: 1, restitution: 0, rollingDecel: 6 },
    { kind: 'dummy-heavy', x: 4.5, y: 7.5, radius: 0.6, mass: 3, restitution: 0.3, rollingDecel: 6 },
  ],
  boxes: [
    { x: 1.75, y: 9, width: 1, height: 1, restitution: 0.5 },
    { x: 7.25, y: 9.5, width: 1, height: 1, restitution: 0.5 },
    { x: 4.5, y: 2.5, width: 3, height: 0.5, restitution: 0.5 },
  ],
};
