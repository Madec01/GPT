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
  /** Nom de l'avant-poste qui commence à ce nœud, affiché en tête sur la carte. */
  outpost?: string;
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

/**
 * Deux avant-postes en ligne : la tranche verticale (six salles, un
 * embranchement après la troisième, le Portier au bout), puis les Terrasses
 * (sept salles, un embranchement après la troisième, le Belvédère au bout).
 */
export const CAMPAIGN: Campaign = {
  start: 'salle-1',
  nodes: {
    'salle-1': { id: 'salle-1', room: roomById('salle-1'), next: ['salle-2'], outpost: 'La Porte de Goulafre' },
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
    'salle-6': { id: 'salle-6', room: roomById('salle-6'), next: ['terrasse-1'] },
    'terrasse-1': { id: 'terrasse-1', room: roomById('terrasse-1'), next: ['terrasse-2'], outpost: 'Les Terrasses' },
    'terrasse-2': { id: 'terrasse-2', room: roomById('terrasse-2'), next: ['terrasse-3'] },
    'terrasse-3': { id: 'terrasse-3', room: roomById('terrasse-3'), next: ['terrasse-4a', 'terrasse-4b'] },
    'terrasse-4a': {
      id: 'terrasse-4a',
      room: roomById('terrasse-4a'),
      next: ['terrasse-5'],
      choiceLabel: 'L\'Infirmerie, salle risquée : une forme à choisir',
    },
    'terrasse-4b': {
      id: 'terrasse-4b',
      room: roomById('terrasse-4b'),
      next: ['terrasse-5'],
      choiceLabel: 'Le Verger suspendu, salle de récupération : deux cœurs rendus',
    },
    'terrasse-5': { id: 'terrasse-5', room: roomById('terrasse-5'), next: ['terrasse-6'] },
    'terrasse-6': { id: 'terrasse-6', room: roomById('terrasse-6'), next: [] },
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
