/**
 * Carte d'un acte : sept étages, trois colonnes, des chemins tirés au sort qui
 * ne se croisent pas. Génération seedée, donc rejouable et testable.
 */
import type { Rng } from '../core/math/rng';

export type NodeType = 'combat' | 'elite' | 'evenement' | 'marchand' | 'repos' | 'tresor' | 'boss';

export interface MapNode {
  id: string;
  floor: number;
  column: number;
  type: NodeType;
  /** Identifiants des nœuds atteignables à l'étage suivant. */
  next: string[];
}

export interface ActMap {
  act: number;
  floors: number;
  columns: number;
  nodes: MapNode[];
}

export const FLOORS = 7;
export const COLUMNS = 3;
const PATHS = 3;

/** Poids des types aux étages 2 à 5. */
const WEIGHTS: ReadonlyArray<[NodeType, number]> = [
  ['combat', 45],
  ['elite', 12],
  ['evenement', 18],
  ['marchand', 10],
  ['repos', 8],
  ['tresor', 7],
];

export function nodeId(act: number, floor: number, column: number): string {
  return `a${act}f${floor}c${column}`;
}

function intBelow(rng: Rng, n: number): number {
  return Math.min(n - 1, Math.floor(rng.next() * n));
}

function crosses(edges: ReadonlyArray<[number, number]>, from: number, to: number): boolean {
  return edges.some(([a, b]) => (a < from && b > to) || (a > from && b < to));
}

/** Génère la carte d'un acte à partir du générateur seedé du run. */
export function generateAct(rng: Rng, act: number): ActMap {
  const present = new Set<string>();
  const edges = new Map<string, Set<string>>();
  const edgesByFloor: Array<Array<[number, number]>> = Array.from({ length: FLOORS + 1 }, () => []);
  const link = (floor: number, from: number, to: number): void => {
    const a = nodeId(act, floor, from);
    const b = nodeId(act, floor + 1, to);
    present.add(a);
    present.add(b);
    if (!edges.has(a)) edges.set(a, new Set());
    edges.get(a)!.add(b);
    edgesByFloor[floor]!.push([from, to]);
  };

  for (let p = 0; p < PATHS; p++) {
    let column = intBelow(rng, COLUMNS);
    present.add(nodeId(act, 1, column));
    for (let floor = 1; floor < FLOORS; floor++) {
      const target = floor + 1 === FLOORS ? 1 : nextColumn(rng, column, edgesByFloor[floor]!);
      link(floor, column, target);
      column = target;
    }
  }

  const nodes: MapNode[] = [];
  const typeOf = new Map<string, NodeType>();
  let merchants = 0;
  for (let floor = 1; floor <= FLOORS; floor++) {
    for (let column = 0; column < COLUMNS; column++) {
      const id = nodeId(act, floor, column);
      if (!present.has(id)) continue;
      const parents = [...typeOf.entries()].filter(([pid]) => edges.get(pid)?.has(id)).map(([, t]) => t);
      let type: NodeType;
      if (floor === 1) type = 'combat';
      else if (floor === FLOORS) type = 'boss';
      else if (floor === FLOORS - 1) type = 'repos';
      else type = drawType(rng, floor, parents, merchants);
      if (type === 'marchand') merchants++;
      typeOf.set(id, type);
      nodes.push({ id, floor, column, type, next: [...(edges.get(id) ?? [])].sort() });
    }
  }
  return { act, floors: FLOORS, columns: COLUMNS, nodes };
}

function nextColumn(rng: Rng, column: number, floorEdges: ReadonlyArray<[number, number]>): number {
  const candidates = [column - 1, column, column + 1].filter((c) => c >= 0 && c < COLUMNS);
  const order = [...candidates];
  for (let i = order.length - 1; i > 0; i--) {
    const j = intBelow(rng, i + 1);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  for (const c of order) if (!crosses(floorEdges, column, c)) return c;
  return column;
}

function drawType(rng: Rng, floor: number, parents: readonly NodeType[], merchants: number): NodeType {
  const allowed = WEIGHTS.filter(([type]) => {
    if (type === 'marchand' && merchants >= 1) return false;
    if (type === 'elite' && floor === 2) return false;
    if (type === 'repos' && (parents.includes('repos') || floor === FLOORS - 2)) return false;
    return true;
  });
  const total = allowed.reduce((acc, [, w]) => acc + w, 0);
  let roll = rng.next() * total;
  for (const [type, w] of allowed) {
    roll -= w;
    if (roll < 0) return type;
  }
  return 'combat';
}

export function nodeById(map: ActMap, id: string): MapNode {
  const node = map.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Nœud de carte inconnu : ${id}`);
  return node;
}

export function startNodes(map: ActMap): MapNode[] {
  return map.nodes.filter((n) => n.floor === 1);
}

export function nextNodes(map: ActMap, id: string): MapNode[] {
  return nodeById(map, id).next.map((n) => nodeById(map, n));
}
