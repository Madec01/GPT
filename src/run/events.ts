/**
 * Événements : huit scènes courtes à deux choix. Les effets modifient l'état
 * de run et renvoient la phrase d'issue. Un événement ne revient pas dans le
 * même run.
 */
import type { Rng } from '../core/math/rng';
import { offerCharms, takeCharm, type RunState } from './state';
import { charmById, type CharmId } from './charms';

export interface EventChoice {
  id: string;
  label: string;
  apply: (state: RunState, rng: Rng) => string;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}

function heal(state: RunState, amount: number): number {
  const before = state.hp;
  state.hp = Math.min(state.maxHp, state.hp + amount);
  return state.hp - before;
}

function hurt(state: RunState, amount: number): void {
  state.hp = Math.max(0, state.hp - amount);
  state.stats.damageTaken += amount;
  if (state.hp <= 0) state.phase = 'dead';
}

function giveCharm(state: RunState, rng: Rng, rarity?: 'commun' | 'rare'): string {
  const options = offerCharms(state, rng, 3).filter((id) => !rarity || charmById(id).rarity === rarity);
  const id: CharmId | undefined = options[0];
  if (!id || !takeCharm(state, id)) return 'Aucun charme ne vous convient : les mains restent vides.';
  return `Vous recevez ${charmById(id).name}.`;
}

export const EVENTS: readonly EventDef[] = [
  {
    id: 'autel',
    title: 'L\'Autel du griffon',
    text: 'Une pierre creuse, tiède, gravée d\'une plume. Elle demande un peu de sang pour rendre un peu de chance.',
    choices: [
      { id: 'offrir', label: 'Offrir un cœur', apply: (s, rng) => { hurt(s, 1); return giveCharm(s, rng, 'rare'); } },
      { id: 'partir', label: 'Passer son chemin', apply: () => 'Dodu salue la pierre et continue.' },
    ],
  },
  {
    id: 'fontaine',
    title: 'La Fontaine',
    text: 'Une eau claire coule d\'une gueule de pierre. Les gardes de Goulafre y jetaient leurs pièces.',
    choices: [
      { id: 'boire', label: 'Boire', apply: (s) => { const n = heal(s, 2); return n > 0 ? `L'eau rend ${n} cœur${n > 1 ? 's' : ''}.` : 'Dodu n\'avait pas soif.'; } },
      { id: 'fouiller', label: 'Fouiller le bassin', apply: (s, rng) => { const found = 20 + Math.floor(rng.next() * 30); s.plumes += found; s.stats.plumesEarned += found; return `${found} plumes d'or au fond du bassin.`; } },
    ],
  },
  {
    id: 'piege',
    title: 'Le Piège à plumes',
    text: 'Un tas de plumes d\'or au milieu d\'un couloir trop calme.',
    choices: [
      { id: 'ramasser', label: 'Ramasser', apply: (s) => { s.plumes += 60; s.stats.plumesEarned += 60; s.nextCombatElite = true; return 'Soixante plumes. Et une cloche qui sonne au loin : le prochain combat sera une élite.'; } },
      { id: 'partir', label: 'Trop beau pour être vrai', apply: () => 'Dodu contourne le tas sans y toucher.' },
    ],
  },
  {
    id: 'forge',
    title: 'La Forge abandonnée',
    text: 'Une enclume encore chaude et trois moules : pierre, caoutchouc, glu.',
    choices: [
      { id: 'pierre', label: 'Se couler en Pierre', apply: (s) => { s.form = 'pierre'; return 'Dodu ressort lourd et fier.'; } },
      { id: 'rebond', label: 'Se couler en Rebond', apply: (s) => { s.form = 'rebond'; return 'Dodu ressort vif comme une balle.'; } },
    ],
  },
  {
    id: 'dragon',
    title: 'Le Dragon endormi',
    text: 'Un dragonnet ronfle sur un coussin de plumes d\'or. Son souffle sent le poivre.',
    choices: [
      { id: 'voler', label: 'Voler le trésor', apply: (s, rng) => { if (rng.next() < 0.5) { s.plumes += 100; s.stats.plumesEarned += 100; return 'Cent plumes, et le dragon n\'a pas bronché.'; } hurt(s, 2); return 'Le dragon éternue : deux cœurs partent en fumée.'; } },
      { id: 'partir', label: 'Le laisser dormir', apply: () => 'Dodu recule sur la pointe des serres.' },
    ],
  },
  {
    id: 'chevalier',
    title: 'Le Vieux chevalier',
    text: 'Un chevalier rouillé propose un échange : une relique contre des soins.',
    choices: [
      { id: 'echanger', label: 'Céder un charme', apply: (s) => { const id = s.charms.pop(); if (!id) return 'Dodu n\'a rien à céder ; le chevalier hausse les épaules.'; heal(s, 2); return `${charmById(id).name} change de mains ; deux cœurs rendus.`; } },
      { id: 'refuser', label: 'Refuser', apply: () => 'Le chevalier grommelle et se rendort.' },
    ],
  },
  {
    id: 'heraut',
    title: 'Le Héraut bavard',
    text: 'Un héraut de Goulafre déclame les exploits de son maître. Il a une bourse à la ceinture.',
    choices: [
      { id: 'ecouter', label: 'Écouter jusqu\'au bout', apply: (s, rng) => giveCharm(s, rng, 'commun') },
      { id: 'bousculer', label: 'Le bousculer', apply: (s) => { s.plumes += 35; s.stats.plumesEarned += 35; return 'La bourse roule : trente-cinq plumes.'; } },
    ],
  },
  {
    id: 'ambulant',
    title: 'Le Marchand ambulant',
    text: 'Un colporteur à capuchon vend une relique à moitié prix, sans garantie.',
    choices: [
      { id: 'acheter', label: 'Acheter pour 30 plumes', apply: (s, rng) => { if (s.plumes < 30) return 'Bourse trop légère.'; s.plumes -= 30; return giveCharm(s, rng); } },
      { id: 'partir', label: 'Décliner', apply: () => 'Le colporteur disparaît dans la brume.' },
    ],
  },
];

export function eventById(id: string): EventDef {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`Événement inconnu : ${id}`);
  return def;
}

/** Tire un événement non encore vu dans ce run ; le marque vu. */
export function drawEvent(state: RunState, rng: Rng): EventDef {
  const fresh = EVENTS.filter((e) => !state.usedEvents.includes(e.id));
  const pool = fresh.length > 0 ? fresh : EVENTS;
  const def = pool[Math.min(pool.length - 1, Math.floor(rng.next() * pool.length))]!;
  state.usedEvents.push(def.id);
  return def;
}
