/**
 * Validation d'une description de salle lue depuis un fichier JSON. Aucune
 * dépendance : chaque erreur nomme le chemin fautif et la règle violée.
 */
import { ENEMIES, PUSHABLES } from '../sim/archetypes';
import type { RoomSpec } from '../sim/room';
import { HERO_BODY } from '../sim/room';
import type { Zone } from '../sim/zones';

export class RoomSpecError extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(`${path} : ${message}`);
    this.name = 'RoomSpecError';
  }
}

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(path: string, message: string): never {
  throw new RoomSpecError(path, message);
}

function num(obj: Obj, key: string, path: string, min = -Infinity, max = Infinity): number {
  const v = obj[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${path}.${key}`, 'nombre fini attendu');
  if (v < min || v > max) fail(`${path}.${key}`, `doit être entre ${min} et ${max}`);
  return v;
}

function optionalNum(obj: Obj, key: string, path: string, min = -Infinity, max = Infinity): number | undefined {
  return obj[key] === undefined ? undefined : num(obj, key, path, min, max);
}

function str(obj: Obj, key: string, path: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.length === 0) fail(`${path}.${key}`, 'chaîne non vide attendue');
  return v;
}

function oneOf<T extends string>(obj: Obj, key: string, path: string, allowed: readonly T[]): T {
  const v = obj[key];
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    fail(`${path}.${key}`, `valeur attendue parmi ${allowed.join(', ')}`);
  }
  return v as T;
}

function arr(obj: Obj, key: string, path: string, required: boolean): unknown[] {
  const v = obj[key];
  if (v === undefined && !required) return [];
  if (!Array.isArray(v)) fail(`${path}.${key}`, 'tableau attendu');
  return v;
}

function object(value: unknown, path: string): Obj {
  if (!isObject(value)) fail(path, 'objet attendu');
  return value;
}

function zone(value: unknown, path: string, width: number, height: number): Zone {
  const z = object(value, path);
  const kind = oneOf(z, 'kind', path, ['disc', 'poly'] as const);
  if (kind === 'disc') {
    return { kind, x: num(z, 'x', path, 0, width), y: num(z, 'y', path, 0, height), r: num(z, 'r', path, 0.05, 20) };
  }
  const points = arr(z, 'points', path, true).map((p, i) => {
    const pt = object(p, `${path}.points[${i}]`);
    return { x: num(pt, 'x', `${path}.points[${i}]`, -5, width + 5), y: num(pt, 'y', `${path}.points[${i}]`, -5, height + 5) };
  });
  if (points.length < 3) fail(`${path}.points`, 'au moins trois points');
  return { kind, points };
}

function insideArena(x: number, y: number, r: number, width: number, height: number, path: string): void {
  if (x - r < 0 || x + r > width || y - r < 0 || y + r > height) fail(path, 'corps hors de l\'arène');
}

/** Valide et renvoie une RoomSpec typée, ou lance une RoomSpecError. */
export function validateRoomSpec(value: unknown, source = 'salle'): RoomSpec {
  const root = object(value, source);
  const id = str(root, 'id', source);
  const name = str(root, 'name', source);
  const width = num(root, 'width', source, 4, 30);
  const height = num(root, 'height', source, 4, 40);
  const seed = num(root, 'seed', source, 0, 4294967295);
  const wallRestitution = num(root, 'wallRestitution', source, 0, 1);

  const heroObj = object(root['hero'], `${source}.hero`);
  const hero = { x: num(heroObj, 'x', `${source}.hero`), y: num(heroObj, 'y', `${source}.hero`) };
  insideArena(hero.x, hero.y, HERO_BODY.radius, width, height, `${source}.hero`);

  const archetypes = Object.keys(ENEMIES) as Array<keyof typeof ENEMIES>;
  const enemies = arr(root, 'enemies', source, true).map((e, i) => {
    const path = `${source}.enemies[${i}]`;
    const o = object(e, path);
    const archetype = oneOf(o, 'archetype', path, archetypes);
    const x = num(o, 'x', path);
    const y = num(o, 'y', path);
    insideArena(x, y, ENEMIES[archetype].radius, width, height, path);
    return { archetype, x, y };
  });

  const pushableKinds = Object.keys(PUSHABLES) as Array<keyof typeof PUSHABLES>;
  const pushables = arr(root, 'pushables', source, false).map((p, i) => {
    const path = `${source}.pushables[${i}]`;
    const o = object(p, path);
    const kind = oneOf(o, 'kind', path, pushableKinds);
    const x = num(o, 'x', path);
    const y = num(o, 'y', path);
    insideArena(x, y, PUSHABLES[kind].radius, width, height, path);
    return { kind, x, y };
  });

  const boxes = arr(root, 'boxes', source, false).map((b, i) => {
    const path = `${source}.boxes[${i}]`;
    const o = object(b, path);
    const x = num(o, 'x', path, 0, width);
    const y = num(o, 'y', path, 0, height);
    const w = num(o, 'width', path, 0.1, width);
    const h = num(o, 'height', path, 0.1, height);
    if (x - w / 2 < 0 || x + w / 2 > width || y - h / 2 < 0 || y + h / 2 > height) fail(path, 'boîte hors de l\'arène');
    const restitution = optionalNum(o, 'restitution', path, 0, 1.5);
    const breakable = o['breakable'] === undefined ? undefined : oneOf(o, 'breakable', path, ['crate', 'barricade', 'column', 'explosive'] as const);
    const bouncy = o['bouncy'] === undefined ? undefined : (typeof o['bouncy'] === 'boolean' ? o['bouncy'] : fail(`${path}.bouncy`, 'booléen attendu'));
    if (bouncy && breakable) fail(`${path}.bouncy`, 'un ressort n\'est pas cassable');
    const collapse = o['collapse'] === undefined ? undefined : zone(o['collapse'], `${path}.collapse`, width, height);
    if (collapse && breakable !== 'column') fail(`${path}.collapse`, 'réservé aux colonnes');
    return {
      x,
      y,
      width: w,
      height: h,
      ...(restitution !== undefined ? { restitution } : {}),
      ...(breakable !== undefined ? { breakable } : {}),
      ...(collapse !== undefined ? { collapse } : {}),
      ...(bouncy !== undefined ? { bouncy } : {}),
    };
  });

  const springboards = arr(root, 'springboards', source, false).map((s, i) => {
    const path = `${source}.springboards[${i}]`;
    const o = object(s, path);
    const dirX = num(o, 'dirX', path, -1, 1);
    const dirY = num(o, 'dirY', path, -1, 1);
    if (dirX === 0 && dirY === 0) fail(path, 'direction nulle');
    const impulse = optionalNum(o, 'impulse', path, 0.5, 20);
    return {
      x: num(o, 'x', path, 0, width),
      y: num(o, 'y', path, 0, height),
      width: num(o, 'width', path, 0.1, width),
      height: num(o, 'height', path, 0.1, height),
      dirX,
      dirY,
      ...(impulse !== undefined ? { impulse } : {}),
    };
  });

  const hazards = arr(root, 'hazards', source, false).map((h, i) => {
    const path = `${source}.hazards[${i}]`;
    const o = object(h, path);
    return { kind: oneOf(o, 'kind', path, ['pit'] as const), zone: zone(o['zone'], `${path}.zone`, width, height) };
  });
  if (hazards.length > 2) fail(`${source}.hazards`, 'deux zones dangereuses fixes au plus par salle');

  const objObj = object(root['objective'], `${source}.objective`);
  const type = oneOf(objObj, 'type', `${source}.objective`, ['eliminate', 'push'] as const);
  let objective: RoomSpec['objective'];
  if (type === 'eliminate') {
    if (enemies.length === 0) fail(`${source}.enemies`, 'un objectif éliminer exige au moins un ennemi');
    objective = { type };
  } else {
    const index = num(objObj, 'object', `${source}.objective`, 0, Math.max(0, pushables.length - 1));
    if (!Number.isInteger(index) || pushables[index] === undefined) fail(`${source}.objective.object`, 'index de poussable invalide');
    const goalObj = object(objObj['goal'], `${source}.objective.goal`);
    const goal = {
      x: num(goalObj, 'x', `${source}.objective.goal`, 0, width),
      y: num(goalObj, 'y', `${source}.objective.goal`, 0, height),
      r: num(goalObj, 'r', `${source}.objective.goal`, 0.5, 10),
    };
    if (goal.r < PUSHABLES[pushables[index]!.kind].radius) fail(`${source}.objective.goal.r`, 'cible plus petite que l\'objet');
    objective = { type, object: index, goal };
  }

  const healOnEnter = optionalNum(root, 'healOnEnter', source, 0, 3);
  const reward = root['reward'] === undefined ? undefined : oneOf(root, 'reward', source, ['forme', 'element'] as const);

  return {
    id,
    name,
    width,
    height,
    seed,
    wallRestitution,
    hero,
    enemies,
    pushables,
    boxes,
    springboards,
    hazards,
    objective,
    ...(healOnEnter !== undefined ? { healOnEnter } : {}),
    ...(reward !== undefined ? { reward } : {}),
  };
}
