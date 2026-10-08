/**
 * Écrans du run roguelite : marchand, événements, repos, trésor, butin de
 * charme, fin de salle, bilan de run, inventaire de charmes. Fonctions pures,
 * sans rendu : chaque écran est un `OverlaySpec` et les identifiants de
 * boutons sont le contrat avec le jeu.
 *
 * Règle commune : un bouton impossible (trop cher, vendu, cœurs pleins) est
 * absent, jamais grisé. Texte en français, lignes courtes, sans tiret cadratin
 * ni parenthèse.
 */
import type { OverlaySpec } from '../render/overlayView';
import { charmById, MAX_CHARMS, type CharmId } from '../run/charms';
import type { EventDef } from '../run/events';
import { HEAL_PRICE, REROLL_PRICE, type ShopOffer } from '../run/shop';
import { ACTS, MAX_HP_CAP, type RunState, type RunSummary } from '../run/state';

/** Noms des trois actes, dans l'ordre. */
export const ACT_NAMES: readonly string[] = ['La Porte de Goulafre', 'Les Terrasses', 'L\'Aire'];

export function actName(act: number): string {
  return ACT_NAMES[Math.min(ACT_NAMES.length, Math.max(1, act)) - 1] ?? `Acte ${act}`;
}

export type RewardContext = 'elite' | 'boss' | 'tresor';

const NUMBER_WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];

function word(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function plumes(n: number): string {
  return `${n} plume${n > 1 ? 's' : ''}`;
}

/** Découpe un texte en phrases, une par ligne, pour rester lisible sur téléphone. */
function sentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g) ?? [];
  const lines = parts.map((p) => p.trim()).filter((p) => p.length > 0);
  return lines.length > 0 ? lines : [text];
}

function charmLine(id: CharmId): string {
  const def = charmById(id);
  return `${def.name} : ${def.description}`;
}

const LEAVE_LABEL = 'Reprendre la route';

export function shopScreen(state: RunState, shop: ShopOffer): OverlaySpec {
  const full = state.charms.length >= MAX_CHARMS;
  const lines = [`Bourse : ${plumes(state.plumes)} d'or`, `Cœurs : ${state.hp} sur ${state.maxHp}`];
  shop.charms.forEach((item) => {
    lines.push(item.sold ? `${charmById(item.id).name} : vendu` : charmLine(item.id));
  });
  if (full) lines.push(`Vous tenez déjà ${word(MAX_CHARMS)} charmes : plus de place.`);

  const buttons: OverlaySpec['buttons'] = [];
  shop.charms.forEach((item, i) => {
    if (item.sold || full || state.plumes < item.price) return;
    buttons.push({ id: `buy:${i}`, label: `${charmById(item.id).name}, ${plumes(item.price)}` });
  });
  if (!shop.healSold && state.hp < state.maxHp && state.plumes >= HEAL_PRICE) {
    buttons.push({ id: 'heal', label: `Un cœur, ${plumes(HEAL_PRICE)}` });
  }
  if (!shop.rerolled && state.plumes >= REROLL_PRICE) {
    buttons.push({ id: 'reroll', label: `Nouvelle offre, ${plumes(REROLL_PRICE)}` });
  }
  buttons.push({ id: 'leave', label: LEAVE_LABEL });
  return { title: 'Marchand', lines, buttons };
}

export function eventScreen(def: EventDef): OverlaySpec {
  return {
    title: def.title,
    lines: sentences(def.text),
    buttons: def.choices.map((c) => ({ id: `choice:${c.id}`, label: c.label })),
  };
}

export function eventOutcomeScreen(def: EventDef, outcome: string): OverlaySpec {
  return { title: def.title, lines: sentences(outcome), buttons: [{ id: 'leave', label: LEAVE_LABEL }] };
}

export function restScreen(state: RunState): OverlaySpec {
  const canHeal = state.hp < state.maxHp;
  const canWatch = state.maxHp < MAX_HP_CAP;
  const lines = [`Cœurs : ${state.hp} sur ${state.maxHp}`];
  if (canHeal) lines.push('Soigner rend deux cœurs.');
  if (canWatch) lines.push(`Veiller ajoute un cœur maximum, jusqu'à ${word(MAX_HP_CAP)}.`);
  if (!canHeal && !canWatch) lines.push('Dodu est en pleine forme. Le feu crépite pour rien.');

  const buttons: OverlaySpec['buttons'] = [];
  if (canHeal) buttons.push({ id: 'rest:soigner', label: 'Soigner deux cœurs' });
  if (canWatch) buttons.push({ id: 'rest:veiller', label: 'Veiller, un cœur maximum de plus' });
  if (buttons.length === 0) buttons.push({ id: 'leave', label: LEAVE_LABEL });
  return { title: 'Repos', lines, buttons };
}

/**
 * Choix d'un charme. `held` est le nombre de charmes déjà tenus : à six, il n'y
 * a plus de place, le dit et ne propose que de ne rien prendre.
 */
export function charmRewardScreen(options: readonly CharmId[], context: RewardContext, held = 0): OverlaySpec {
  const full = held >= MAX_CHARMS;
  const title = context === 'tresor' ? 'Un trésor' : context === 'elite' ? 'Butin d\'élite' : 'Butin du gardien';
  const intro =
    context === 'tresor' ? 'Un coffre s\'ouvre sur trois reliques.' : context === 'elite' ? 'L\'élite lâche une relique.' : 'Le gardien laisse une relique derrière lui.';
  const lines = [intro];
  if (options.length === 0) lines.push('Plus aucun charme à offrir.');
  else lines.push(full ? 'Voici les reliques offertes.' : 'Choisissez un charme.');
  for (const id of options) lines.push(charmLine(id));
  if (full) lines.push(`Vous tenez déjà ${word(MAX_CHARMS)} charmes : plus de place.`);

  const buttons: OverlaySpec['buttons'] = full ? [] : options.map((id) => ({ id: `charm:${id}`, label: charmById(id).name }));
  buttons.push({ id: 'charm:none', label: 'Rien prendre' });
  return { title, lines, buttons };
}

export function treasureScreen(options: readonly CharmId[], held = 0): OverlaySpec {
  return charmRewardScreen(options, 'tresor', held);
}

export function combatWonScreen(roomName: string, turns: number, plumesGained: number, contractLine: string | null, elite: boolean): OverlaySpec {
  const lines = [roomName, `Terminée en ${turns} tour${turns > 1 ? 's' : ''}.`, `Vous gagnez ${plumes(plumesGained)} d'or.`];
  if (contractLine) lines.push(contractLine);
  return { title: elite ? 'Élite vaincue' : 'Salle gagnée', lines, buttons: [{ id: 'continue', label: 'Continuer' }] };
}

function summaryLines(summary: RunSummary): string[] {
  return [
    `Acte atteint : ${summary.act} sur ${ACTS}`,
    `Salles franchies : ${summary.rooms}`,
    `Ennemis vaincus : ${summary.kills}`,
    `Plumes d'or gagnées : ${summary.plumes}`,
    `Charmes tenus : ${summary.charms.length > 0 ? summary.charms.join(', ') : 'aucun'}`,
  ];
}

const END_BUTTONS = [
  { id: 'restart', label: 'Nouveau run' },
  { id: 'quit', label: 'Accueil' },
];

export function runDeadScreen(summary: RunSummary): OverlaySpec {
  return { title: 'Dodu est tombé', lines: summaryLines(summary), buttons: END_BUTTONS.map((b) => ({ ...b })) };
}

export function runWonScreen(summary: RunSummary): OverlaySpec {
  return { title: 'Les œufs sont rendus', lines: summaryLines(summary), buttons: END_BUTTONS.map((b) => ({ ...b })) };
}

/** Inventaire des charmes, lisible depuis la pause. */
export function charmsScreen(state: RunState): OverlaySpec {
  const lines = [`Charmes tenus : ${state.charms.length} sur ${MAX_CHARMS}`, `Cœurs : ${state.hp} sur ${state.maxHp}`, `Plumes d'or : ${state.plumes}`];
  if (state.charms.length === 0) lines.push('Aucun charme pour le moment.');
  for (const id of state.charms) {
    const spent = id === 'oeuf-de-secours' && state.spareLifeUsed ? ' Déjà utilisé.' : '';
    lines.push(`${charmLine(id)}${spent}`);
  }
  return { title: 'Charmes', lines, buttons: [{ id: 'back-pause', label: 'Retour' }] };
}
