/**
 * Constructeurs purs des écrans de transition : chaque fonction renvoie la
 * description d'un écran (titre, lignes, boutons) à partir de l'état. Les
 * identifiants de boutons sont le contrat avec le jeu.
 */
import type { Campaign, CampaignNode } from '../data/campaign';
import type { CreditDef } from '../render/assets';
import type { OverlaySpec } from '../render/overlayView';
import { volumeLabel, type GameSettings } from './options';
import type { RunStats } from './storage';

export const CREDITS_PER_PAGE = 4;

export function titleScreen(hasSave: boolean, version: string): OverlaySpec {
  return {
    title: 'FRONDE',
    lines: ['Dodu, le griffonneau trop rond pour voler, part reprendre les œufs de Rondeval.', `Version ${version}`],
    buttons: [
      ...(hasSave ? [{ id: 'continue-run', label: 'Continuer la partie' }] : []),
      { id: 'new-run', label: hasSave ? 'Nouvelle partie' : 'Jouer' },
      { id: 'options', label: 'Options' },
      { id: 'credits', label: 'Crédits' },
    ],
  };
}

export function optionsScreen(settings: GameSettings, nodeNames: readonly string[], testNodeIndex: number, from: 'title' | 'pause'): OverlaySpec {
  const t = settings.test;
  const buttons = [
    { id: 'opt-master', label: `Volume général : ${volumeLabel(settings.volumes.master)}` },
    { id: 'opt-sfx', label: `Bruitages : ${volumeLabel(settings.volumes.sfx)}` },
    { id: 'opt-music', label: `Musique : ${volumeLabel(settings.volumes.music)}` },
    { id: 'opt-brake', label: `Frein à ${settings.brakeSide === 'left' ? 'gauche' : 'droite'}` },
    { id: 'opt-test', label: `Mode test : ${t.enabled ? 'activé' : 'désactivé'}` },
  ];
  if (t.enabled) {
    buttons.push(
      { id: 'opt-invincible', label: `Invincible : ${t.invincible ? 'oui' : 'non'}` },
      { id: 'opt-fullpath', label: `Trajet complet affiché : ${t.fullPath ? 'oui' : 'non'}` },
      { id: 'opt-node', label: `Salle de départ : ${nodeNames[testNodeIndex] ?? '?'}` },
    );
  }
  buttons.push({ id: from === 'pause' ? 'back-pause' : 'back-title', label: 'Retour' });
  return { title: 'Options', lines: [], buttons };
}

export function creditsScreen(credits: readonly CreditDef[], page: number): OverlaySpec {
  const pages = Math.max(1, Math.ceil(credits.length / CREDITS_PER_PAGE));
  const p = Math.min(Math.max(0, page), pages - 1);
  const slice = credits.slice(p * CREDITS_PER_PAGE, (p + 1) * CREDITS_PER_PAGE);
  const lines = slice.map((c) => (c.attribution ? c.attribution : `${c.title}, ${c.author}, ${c.license}`));
  if (credits.length === 0) lines.push('Aucune ressource embarquée : formes vectorielles.');
  return {
    title: `Crédits ${p + 1}/${pages}`,
    lines,
    buttons: [
      ...(pages > 1 ? [{ id: 'credits-next', label: p + 1 < pages ? 'Page suivante' : 'Première page' }] : []),
      { id: 'back-title', label: 'Retour' },
    ],
  };
}

export function pauseScreen(roomName: string): OverlaySpec {
  return {
    title: 'Pause',
    lines: [roomName],
    buttons: [
      { id: 'resume', label: 'Reprendre' },
      { id: 'retry', label: 'Recommencer la salle' },
      { id: 'map-pause', label: 'Carte' },
      { id: 'options-pause', label: 'Options' },
      { id: 'quit', label: 'Quitter vers l\'accueil' },
    ],
  };
}

/** Carte textuelle de la campagne : une ligne par nœud, le nœud courant fléché, le choix à l'embranchement en boutons. */
export function mapScreen(campaign: Campaign, currentId: string, path: readonly string[], nextIds: readonly string[], readOnly = false): OverlaySpec {
  const lines: string[] = [];
  const visited = new Set(path);
  const order = campaignOrder(campaign);
  for (const row of order) {
    const parts = row.map((node) => {
      const mark = node.id === currentId ? '➤ ' : visited.has(node.id) ? '✓ ' : '· ';
      const tag = node.room.reward ? ' ☠ pouvoir' : node.room.healOnEnter ? ' ♥ repos' : '';
      return `${mark}${node.room.name}${tag}`;
    });
    lines.push(parts.join('   ou   '));
  }
  if (readOnly) return { title: 'Carte de l\'avant-poste', lines, buttons: [{ id: 'back-pause', label: 'Retour' }] };
  const buttons =
    nextIds.length >= 2
      ? nextIds.map((id) => {
          const node = campaign.nodes[id]!;
          return { id: `go:${id}`, label: node.choiceLabel ?? node.room.name };
        })
      : nextIds.length === 1
        ? [{ id: `go:${nextIds[0]}`, label: `Entrer : ${campaign.nodes[nextIds[0]!]!.room.name}` }]
        : [{ id: 'restart', label: 'Recommencer depuis le début' }];
  return { title: nextIds.length >= 2 ? 'Deux chemins' : 'Carte de l\'avant-poste', lines, buttons };
}

/** Lignes de la carte : les nœuds en ordre, les frères d'un embranchement sur la même ligne. */
export function campaignOrder(campaign: Campaign): CampaignNode[][] {
  const rows: CampaignNode[][] = [];
  const seen = new Set<string>();
  let frontier = [campaign.start];
  while (frontier.length > 0) {
    const row = frontier.filter((id) => !seen.has(id)).map((id) => campaign.nodes[id]!);
    if (row.length === 0) break;
    for (const node of row) seen.add(node.id);
    rows.push(row);
    const next = new Set<string>();
    for (const node of row) for (const id of node.next) next.add(id);
    frontier = [...next];
  }
  return rows;
}

/** Deux épilogues : sans dégât sur tout le run, ou victoire ordinaire. */
export function endingScreen(stats: RunStats): OverlaySpec {
  const totalTurns = Object.values(stats.turns).reduce((a, b) => a + b, 0);
  const flawless = stats.damageTaken === 0;
  return {
    title: flawless ? 'Avant-poste libéré, sans une égratignure' : 'Avant-poste libéré',
    lines: [
      flawless
        ? 'Gueule-de-Pierre n\'a pas touché une plume. La Garde parlera longtemps de ce poussin.'
        : 'Le premier œuf est sauf. Dodu a des bleus, et un début de réputation.',
      `${stats.roomsCleared} salles, ${totalTurns} tours, ${stats.damageTaken} dégât${stats.damageTaken > 1 ? 's' : ''} subi${stats.damageTaken > 1 ? 's' : ''}.`,
    ],
    buttons: [{ id: 'restart', label: 'Recommencer depuis le début' }, { id: 'quit', label: 'Retour à l\'accueil' }],
  };
}
