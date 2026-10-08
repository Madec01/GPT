/**
 * Constructeurs purs des écrans de transition : chaque fonction renvoie la
 * description d'un écran (titre, lignes, boutons) à partir de l'état. Les
 * identifiants de boutons sont le contrat avec le jeu.
 */
import type { CreditDef } from '../render/assets';
import type { OverlaySpec } from '../render/overlayView';
import { volumeLabel, type GameSettings } from './options';
import type { HeroElement, HeroForm } from '../sim/components';
import { ELEMENT_CARD, FORM_CARDS, formName, synergyLine } from '../sim/rules/powers';

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
      { id: 'map-pause', label: 'Carte du run' },
      { id: 'charms-pause', label: 'Charmes' },
      { id: 'options-pause', label: 'Options' },
      { id: 'quit', label: 'Quitter vers l\'accueil' },
      { id: 'restart', label: 'Abandonner et recommencer' },
    ],
  };
}

/** Choix d'une forme en sortie de salle risquée, avec la synergie de l'élément tenu. */
export function formChoiceScreen(turns: number, element: HeroElement): OverlaySpec {
  const lines = [`Terminée en ${turns} tour${turns > 1 ? 's' : ''}. Choisissez une forme.`];
  for (const card of FORM_CARDS) {
    const synergy = synergyLine(card.id as HeroForm, element);
    lines.push(`${card.name} : ${card.description} ${card.strong}${synergy ? ` ${synergy}` : ''}`);
  }
  return { title: 'Une forme à prendre', lines, buttons: FORM_CARDS.map((c) => ({ id: `form:${c.id}`, label: c.name })) };
}

/** L'élément, offert en sortie de la Herse, avec la synergie de la forme tenue. */
export function elementScreen(turns: number, form: HeroForm): OverlaySpec {
  const synergy = synergyLine(form, 'electricite');
  return {
    title: `Élément trouvé : ${ELEMENT_CARD.name}`,
    lines: [
      `Terminée en ${turns} tour${turns > 1 ? 's' : ''}.`,
      `${ELEMENT_CARD.description} ${ELEMENT_CARD.strong}`,
      ...(synergy ? [synergy] : [form === 'none' ? 'Sans forme, les arcs restent simples.' : `Forme actuelle : ${formName(form)}.`]),
    ],
    buttons: [{ id: 'equip-element', label: `Équiper ${ELEMENT_CARD.name}` }],
  };
}
