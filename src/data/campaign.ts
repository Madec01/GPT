/**
 * Structure de la campagne : une ligne de salles avec un embranchement.
 * Les nœuds pointent vers leurs successeurs ; deux successeurs forment un
 * choix présenté au joueur.
 */
import type { RoomSpec } from '../sim/room';
import { roomById } from './rooms';
import { GREY_ROOM } from './rooms/grey';

export interface CampaignNode {
  id: string;
  room: RoomSpec;
  /** Successeurs : aucun en fin de campagne, un en ligne droite, deux à un embranchement. */
  next: readonly string[];
  /** Texte du choix quand ce nœud est proposé à un embranchement. */
  choiceLabel?: string;
}

export interface Campaign {
  start: string;
  nodes: Readonly<Record<string, CampaignNode>>;
}

export function nodeOf(campaign: Campaign, id: string): CampaignNode {
  const node = campaign.nodes[id];
  if (!node) throw new Error(`Nœud de campagne inconnu : ${id}`);
  return node;
}

/** La tranche verticale : six salles, un embranchement après la troisième. */
export const CAMPAIGN: Campaign = {
  start: 'salle-1',
  nodes: {
    'salle-1': { id: 'salle-1', room: roomById('salle-1'), next: ['salle-2'] },
    'salle-2': { id: 'salle-2', room: roomById('salle-2'), next: ['salle-3'] },
    'salle-3': { id: 'salle-3', room: roomById('salle-3'), next: ['salle-4a', 'salle-4b'] },
    'salle-4a': {
      id: 'salle-4a',
      room: roomById('salle-4a'),
      next: ['salle-5'],
      choiceLabel: 'La Forge du rempart, salle risquée : une forme à choisir',
    },
    'salle-4b': {
      id: 'salle-4b',
      room: roomById('salle-4b'),
      next: ['salle-5'],
      choiceLabel: 'La Citerne, salle de récupération : deux cœurs rendus',
    },
    'salle-5': { id: 'salle-5', room: roomById('salle-5'), next: ['salle-6'] },
    'salle-6': { id: 'salle-6', room: roomById('salle-6'), next: [] },
  },
};

/** Campagne d'essai : la salle grise partout, pour développer l'enchaînement sans contenu. */
export const TEST_CAMPAIGN: Campaign = {
  start: 'a',
  nodes: {
    a: { id: 'a', room: { ...GREY_ROOM, id: 'grey-a', name: 'Essai A' }, next: ['b'] },
    b: { id: 'b', room: { ...GREY_ROOM, id: 'grey-b', name: 'Essai B' }, next: ['c1', 'c2'] },
    c1: { id: 'c1', room: { ...GREY_ROOM, id: 'grey-c1', name: 'Essai C risquée', reward: 'forme' }, next: ['d'], choiceLabel: 'Salle risquée : le pouvoir Pierre à la clé' },
    c2: { id: 'c2', room: { ...GREY_ROOM, id: 'grey-c2', name: 'Essai C repos', healOnEnter: 2 }, next: ['d'], choiceLabel: 'Salle de récupération : deux cœurs rendus' },
    d: { id: 'd', room: { ...GREY_ROOM, id: 'grey-d', name: 'Essai D' }, next: [] },
  },
};
