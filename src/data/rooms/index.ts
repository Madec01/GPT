/**
 * Les salles de la tranche verticale puis des Terrasses, lues depuis leurs
 * fichiers JSON et validées au chargement : une salle mal formée fait échouer
 * le démarrage et les tests plutôt que de se révéler en jeu.
 */
import type { RoomSpec } from '../../sim/room';
import { validateRoomSpec } from '../schema';
import salle1 from './01-cour-basse.json';
import salle2 from './02-chemin-de-ronde.json';
import salle3 from './03-nurserie-volee.json';
import salle4a from './04a-forge-du-rempart.json';
import salle4b from './04b-citerne.json';
import salle5 from './05-herse.json';
import salle6 from './06-portier.json';
import terrasse1 from './11-perron.json';
import terrasse2 from './12-mur-d-ecus.json';
import terrasse3 from './13-poudriere.json';
import terrasse4a from './14a-infirmerie.json';
import terrasse4b from './14b-verger.json';
import terrasse5 from './15-boutefeu.json';
import terrasse6 from './16-belvedere.json';

const SOURCES: Array<[string, unknown]> = [
  ['01-cour-basse.json', salle1],
  ['02-chemin-de-ronde.json', salle2],
  ['03-nurserie-volee.json', salle3],
  ['04a-forge-du-rempart.json', salle4a],
  ['04b-citerne.json', salle4b],
  ['05-herse.json', salle5],
  ['06-portier.json', salle6],
  ['11-perron.json', terrasse1],
  ['12-mur-d-ecus.json', terrasse2],
  ['13-poudriere.json', terrasse3],
  ['14a-infirmerie.json', terrasse4a],
  ['14b-verger.json', terrasse4b],
  ['15-boutefeu.json', terrasse5],
  ['16-belvedere.json', terrasse6],
];

/** Salles validées, indexées par leur identifiant. */
export const ROOMS: Readonly<Record<string, RoomSpec>> = Object.fromEntries(
  SOURCES.map(([file, json]) => {
    const spec = validateRoomSpec(json, file);
    return [spec.id, spec];
  }),
);

export function roomById(id: string): RoomSpec {
  const spec = ROOMS[id];
  if (!spec) throw new Error(`Salle inconnue : ${id}`);
  return spec;
}
