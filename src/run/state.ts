/**
 * État d'un run roguelite et ses transitions, en données simples : tout se
 * sauvegarde tel quel et se rejoue depuis la graine. Le choix des salles reste
 * à l'appelant, qui fournit les candidats du vivier.
 */
import { createRng, type Rng } from '../core/math/rng';
import type { HeroElement, HeroForm } from '../sim/components';
import type { RunModifiers } from '../sim/modifiers';
import type { HeroCarry } from '../sim/room';
import { CHARMS, charmById, isCharmId, MAX_CHARMS, modifiersFor, plumesMultiplier, type CharmId } from './charms';
import { generateAct, nextNodes, nodeById, startNodes, type ActMap, type MapNode } from './map';

export const ACTS = 3;
export const START_HP = 3;
export const MAX_HP_CAP = 6;

export interface RunStats {
  rooms: number;
  elites: number;
  bosses: number;
  kills: number;
  plumesEarned: number;
  damageTaken: number;
  turns: number;
  charmsFound: number;
}

export type RunPhase = 'map' | 'node' | 'dead' | 'won';

/** Récompense en attente d'un choix du joueur après un combat. */
export type PendingReward = { kind: 'charm'; options: CharmId[] } | { kind: 'form' } | { kind: 'element' };

export interface RunState {
  version: 2;
  seed: number;
  rngState: number;
  act: number;
  map: ActMap;
  /** Nœud courant, ou null avant le premier choix de l'acte. */
  nodeId: string | null;
  visited: string[];
  phase: RunPhase;
  hp: number;
  maxHp: number;
  charge: number;
  form: HeroForm;
  element: HeroElement;
  charms: CharmId[];
  spareLifeUsed: boolean;
  plumes: number;
  usedRooms: string[];
  usedEvents: string[];
  /** Le prochain combat se joue en élite, Piège à plumes. */
  nextCombatElite: boolean;
  reward: PendingReward | null;
  stats: RunStats;
}

export function emptyRunStats(): RunStats {
  return { rooms: 0, elites: 0, bosses: 0, kills: 0, plumesEarned: 0, damageTaken: 0, turns: 0, charmsFound: 0 };
}

/** Tire des nombres depuis l'état du run et y range le générateur ensuite. */
export function withRng<T>(state: RunState, fn: (rng: Rng) => T): T {
  const rng = createRng(state.rngState);
  const result = fn(rng);
  state.rngState = rng.getState();
  return result;
}

export function newRun(seed: number): RunState {
  const state: RunState = {
    version: 2,
    seed: seed >>> 0,
    rngState: seed >>> 0,
    act: 1,
    map: { act: 1, floors: 0, columns: 0, nodes: [] },
    nodeId: null,
    visited: [],
    phase: 'map',
    hp: START_HP,
    maxHp: START_HP,
    charge: 0,
    form: 'none',
    element: 'none',
    charms: [],
    spareLifeUsed: false,
    plumes: 0,
    usedRooms: [],
    usedEvents: [],
    nextCombatElite: false,
    reward: null,
    stats: emptyRunStats(),
  };
  state.map = withRng(state, (rng) => generateAct(rng, 1));
  return state;
}

export function currentNode(state: RunState): MapNode | null {
  return state.nodeId === null ? null : nodeById(state.map, state.nodeId);
}

/** Nœuds que le joueur peut choisir maintenant. */
export function reachable(state: RunState): MapNode[] {
  if (state.phase !== 'map') return [];
  return state.nodeId === null ? startNodes(state.map) : nextNodes(state.map, state.nodeId);
}

/** Entre dans un nœud atteignable ; renvoie le nœud. */
export function moveTo(state: RunState, id: string): MapNode {
  const node = reachable(state).find((n) => n.id === id);
  if (!node) throw new Error(`Nœud inaccessible : ${id}`);
  state.nodeId = id;
  state.visited.push(id);
  state.phase = 'node';
  return node;
}

/** Le nœud courant est réglé : retour à la carte, ou acte suivant après un boss. */
export function leaveNode(state: RunState): void {
  if (state.phase === 'dead' || state.phase === 'won') return;
  const node = currentNode(state);
  if (node?.type === 'boss') {
    if (state.act >= ACTS) {
      state.phase = 'won';
      return;
    }
    state.act++;
    state.map = withRng(state, (rng) => generateAct(rng, state.act));
    state.nodeId = null;
    state.visited = [];
  }
  state.phase = 'map';
}

export function carryFor(state: RunState): HeroCarry {
  return { hp: state.hp, charge: state.charge, form: state.form, element: state.element };
}

export function modsFor(state: RunState, elite: boolean): RunModifiers {
  return modifiersFor(state.charms, state.maxHp, elite);
}

/** Palier de salle d'un acte. */
export function tierFor(act: number): 1 | 2 | 3 {
  return act <= 1 ? 1 : act === 2 ? 2 : 3;
}

/** Choisit une salle parmi les candidats non encore joués ; les marque jouée. */
export function pickRoom<T extends { id: string }>(state: RunState, candidates: readonly T[]): T {
  if (candidates.length === 0) throw new Error('Aucune salle candidate');
  const fresh = candidates.filter((c) => !state.usedRooms.includes(c.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  const pick = withRng(state, (rng) => pool[Math.min(pool.length - 1, Math.floor(rng.next() * pool.length))]!);
  state.usedRooms.push(pick.id);
  return pick;
}

export interface CombatResult {
  hp: number;
  charge: number;
  form: HeroForm;
  element: HeroElement;
  kills: number;
  turns: number;
  damageTaken: number;
  contractDone: boolean;
  elite: boolean;
  boss: boolean;
}

/** Comptabilise une salle gagnée : plumes, statistiques, récompense en attente. */
export function completeCombat(state: RunState, result: CombatResult): { plumes: number; reward: PendingReward | null } {
  state.hp = result.hp;
  state.charge = result.charge;
  state.form = result.form;
  state.element = result.element;
  state.stats.rooms++;
  state.stats.kills += result.kills;
  state.stats.turns += result.turns;
  state.stats.damageTaken += result.damageTaken;
  if (result.elite) state.stats.elites++;
  if (result.boss) state.stats.bosses++;
  const base = 20 + 5 * result.kills + (result.elite ? 30 : 0) + (result.boss ? 50 : 0) + (result.contractDone ? 10 : 0);
  const plumes = Math.round(base * plumesMultiplier(state.charms));
  state.plumes += plumes;
  state.stats.plumesEarned += plumes;
  state.nextCombatElite = false;
  let reward: PendingReward | null = null;
  if (result.boss && state.act === 1 && state.form === 'none') reward = { kind: 'form' };
  else if (result.boss && state.act === 2 && state.element === 'none') reward = { kind: 'element' };
  else if (result.elite || result.boss) reward = { kind: 'charm', options: withRng(state, (rng) => offerCharms(state, rng, 3)) };
  state.reward = reward;
  return { plumes, reward };
}

/** Seconde vie disponible : Œuf de secours tenu et non consommé. */
export function canRevive(state: RunState): boolean {
  return state.charms.includes('oeuf-de-secours') && !state.spareLifeUsed;
}

export function useRevive(state: RunState): boolean {
  if (!canRevive(state)) return false;
  state.spareLifeUsed = true;
  state.hp = 1;
  return true;
}

export function die(state: RunState): void {
  state.hp = 0;
  state.phase = 'dead';
}

/** Trois charmes non tenus, communs deux fois sur trois. */
export function offerCharms(state: RunState, rng: Rng, count: number): CharmId[] {
  const held = new Set(state.charms);
  const available = CHARMS.filter((c) => !held.has(c.id));
  const picks: CharmId[] = [];
  while (picks.length < count && available.length > picks.length) {
    const wantRare = rng.next() < 0.3;
    const candidates = available.filter((c) => !picks.includes(c.id) && (c.rarity === (wantRare ? 'rare' : 'commun')));
    const fallback = available.filter((c) => !picks.includes(c.id));
    const from = candidates.length > 0 ? candidates : fallback;
    picks.push(from[Math.min(from.length - 1, Math.floor(rng.next() * from.length))]!.id);
  }
  return picks;
}

export function takeCharm(state: RunState, id: CharmId): boolean {
  if (!isCharmId(id) || state.charms.includes(id) || state.charms.length >= MAX_CHARMS) return false;
  state.charms.push(id);
  state.stats.charmsFound++;
  return true;
}

/** Repos : soigner deux cœurs, ou veiller pour un cœur maximum de plus. */
export function rest(state: RunState, choice: 'soigner' | 'veiller'): void {
  if (choice === 'soigner') state.hp = Math.min(state.maxHp, state.hp + 2);
  else if (state.maxHp < MAX_HP_CAP) {
    state.maxHp++;
    state.hp++;
  }
}

export function chooseForm(state: RunState, form: HeroForm): void {
  state.form = form;
  state.reward = null;
}

export function chooseElement(state: RunState): void {
  state.element = 'electricite';
  state.reward = null;
}

export function chooseCharm(state: RunState, id: CharmId | null): void {
  if (id !== null && state.reward?.kind === 'charm' && state.reward.options.includes(id)) takeCharm(state, id);
  state.reward = null;
}

export interface RunSummary {
  act: number;
  rooms: number;
  kills: number;
  plumes: number;
  charms: string[];
  turns: number;
  damageTaken: number;
  won: boolean;
}

export function summary(state: RunState): RunSummary {
  return {
    act: state.act,
    rooms: state.stats.rooms,
    kills: state.stats.kills,
    plumes: state.stats.plumesEarned,
    charms: state.charms.map((id) => charmById(id).name),
    turns: state.stats.turns,
    damageTaken: state.stats.damageTaken,
    won: state.phase === 'won',
  };
}

/** Lecture tolérante d'un état sauvegardé : null si la forme ne convient pas. */
export function parseRunState(value: unknown): RunState | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v['version'] !== 2) return null;
  const num = (k: string): number | null => (typeof v[k] === 'number' && Number.isFinite(v[k]) ? (v[k] as number) : null);
  const seed = num('seed');
  const rngState = num('rngState');
  const act = num('act');
  const hp = num('hp');
  const maxHp = num('maxHp');
  const charge = num('charge');
  const plumes = num('plumes');
  if (seed === null || rngState === null || act === null || hp === null || maxHp === null || charge === null || plumes === null) return null;
  if (act < 1 || act > ACTS || hp < 0 || hp > MAX_HP_CAP || maxHp < 1 || maxHp > MAX_HP_CAP) return null;
  const phase = v['phase'];
  if (phase !== 'map' && phase !== 'node' && phase !== 'dead' && phase !== 'won') return null;
  const form = v['form'];
  if (form !== 'none' && form !== 'pierre' && form !== 'rebond' && form !== 'glu') return null;
  const element = v['element'];
  if (element !== 'none' && element !== 'electricite') return null;
  const strings = (k: string): string[] | null => (Array.isArray(v[k]) && (v[k] as unknown[]).every((x) => typeof x === 'string') ? [...(v[k] as string[])] : null);
  const visited = strings('visited');
  const usedRooms = strings('usedRooms');
  const usedEvents = strings('usedEvents');
  const charmsRaw = strings('charms');
  if (!visited || !usedRooms || !usedEvents || !charmsRaw || !charmsRaw.every(isCharmId)) return null;
  const map = v['map'];
  if (typeof map !== 'object' || map === null || !Array.isArray((map as ActMap).nodes)) return null;
  const nodeId = v['nodeId'];
  if (nodeId !== null && typeof nodeId !== 'string') return null;
  const statsRaw = (typeof v['stats'] === 'object' && v['stats'] !== null ? v['stats'] : {}) as Record<string, unknown>;
  const stats = emptyRunStats();
  for (const key of Object.keys(stats) as Array<keyof RunStats>) {
    if (typeof statsRaw[key] === 'number') stats[key] = statsRaw[key] as number;
  }
  const rewardRaw = v['reward'];
  let reward: PendingReward | null = null;
  if (typeof rewardRaw === 'object' && rewardRaw !== null) {
    const r = rewardRaw as Record<string, unknown>;
    if (r['kind'] === 'form' || r['kind'] === 'element') reward = { kind: r['kind'] };
    else if (r['kind'] === 'charm' && Array.isArray(r['options']) && r['options'].every(isCharmId)) reward = { kind: 'charm', options: [...(r['options'] as CharmId[])] };
  }
  return {
    version: 2,
    seed,
    rngState,
    act,
    map: map as ActMap,
    nodeId: nodeId as string | null,
    visited,
    phase,
    hp,
    maxHp,
    charge,
    form,
    element,
    charms: charmsRaw as CharmId[],
    spareLifeUsed: v['spareLifeUsed'] === true,
    plumes,
    usedRooms,
    usedEvents,
    nextCombatElite: v['nextCombatElite'] === true,
    reward,
    stats,
  };
}
