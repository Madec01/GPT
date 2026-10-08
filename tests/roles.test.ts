import { describe, expect, it } from 'vitest';
import { GREY_ROOM } from '../src/data/rooms/grey';
import { validateRoomSpec } from '../src/data/schema';
import { RULES } from '../src/sim/archetypes';
import { Breakable, Enemy, Health } from '../src/sim/components';
import { chooseIntent } from '../src/sim/intents';
import type { RoomSpec } from '../src/sim/room';
import { RoomRun } from '../src/sim/rules/turn';

function room(overrides: Partial<RoomSpec> = {}): RoomSpec {
  return {
    id: 'test',
    name: 'Salle de test',
    width: 10,
    height: 10,
    seed: 7,
    wallRestitution: 0.7,
    hero: { x: 5, y: 8 },
    enemies: [],
    pushables: [],
    boxes: [],
    springboards: [],
    hazards: [],
    objective: { type: 'eliminate' },
    ...overrides,
  };
}

/** Ennemi lointain dont la zone ne peut pas atteindre le héros, pour garder un objectif non trivial. */
const FAR_GELEE = { archetype: 'gelee', x: 9, y: 1 } as const;

function play(run: RoomRun, dirX: number, dirY: number, power = 1) {
  expect(run.throwHero(dirX, dirY, power)).toBe(true);
  const events: ReturnType<RoomRun['tick']> = [];
  while (run.phase === 'moving') events.push(...run.tick());
  return events;
}

function enemyAt(run: RoomRun, index: number) {
  const entity = run.enemies()[index]!;
  return { entity, enemy: run.sim.world.require(entity, Enemy), health: run.sim.world.require(entity, Health) };
}

describe('bouclier orienté', () => {
  it('tourne vers Dodu au début du tour', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 4, shield: true }] }));
    const { enemy } = enemyAt(run, 0);
    expect(enemy.shield).toBe(true);
    expect(enemy.shieldX).toBeCloseTo(0);
    expect(enemy.shieldY).toBeCloseTo(1);
  });

  it('un impact de face renvoie Dodu sans le blesser ; de dos, dégâts normaux', () => {
    const front = RoomRun.fromSpec(room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 4, shield: true }, FAR_GELEE] }));
    const events = play(front, 0, -1);
    expect(events.some((e) => e.type === 'shield')).toBe(true);
    expect(events.some((e) => e.type === 'damage')).toBe(false);
    expect(enemyAt(front, 0).health.hp).toBe(ENEMY_HP.rocailleux);
    expect(front.heroPosition().y).toBeGreaterThan(4.6);

    // Même ennemi, Dodu placé derrière lui : le bouclier regarde vers le bas, l'impact vient du haut.
    const back = RoomRun.fromSpec(room({ hero: { x: 5, y: 8 }, enemies: [{ archetype: 'rocailleux', x: 5, y: 4, shield: true }, FAR_GELEE] }));
    const { enemy } = enemyAt(back, 0);
    enemy.shieldX = 0;
    enemy.shieldY = -1;
    const backEvents = play(back, 0, -1);
    expect(backEvents.some((e) => e.type === 'shield')).toBe(false);
    expect(backEvents.some((e) => e.type === 'damage')).toBe(true);
  });

  it('un bouclier de face sur une gelée empêche aussi le collage', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 5, y: 4, shield: true }, FAR_GELEE] }));
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'shield')).toBe(true);
    expect(events.some((e) => e.type === 'stick')).toBe(false);
  });
});

const ENEMY_HP = { crapaud: 2, gelee: 2, rocailleux: 3 } as const;

describe('rôles', () => {
  it('les zones des rôles ne blessent pas et sont annoncées sans danger', () => {
    const intent = chooseIntent('crapaud', { x: 5, y: 5 }, { x: 5, y: 9 }, 0, 'guerisseur');
    expect(intent).toMatchObject({ pattern: 'soin', harmless: true });
    expect(intent.zones[0]).toMatchObject({ kind: 'disc', r: RULES.healerZoneRadius });
    const pose = chooseIntent('rocailleux', { x: 5, y: 5 }, { x: 5, y: 9 }, 0, 'artificier');
    expect(pose.zones[0]).toMatchObject({ kind: 'disc', x: 5, y: 6.6, r: RULES.placeZoneRadius });
    expect(chooseIntent('crapaud', { x: 5, y: 5 }, { x: 5, y: 9 }, 0).harmless).toBe(false);

    // Dodu s'arrête dans la zone d'un guérisseur sans rien subir.
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'gelee', x: 5, y: 6, role: 'guerisseur' }, FAR_GELEE] }));
    const events = play(run, 0, -1, 0.3);
    expect(events.some((e) => e.type === 'heroHit')).toBe(false);
    expect(run.hero.hp).toBe(3);
  });

  it('le guérisseur rend un point aux autres blessés en fin de tour, pas à lui-même, pas sonné', () => {
    const spec = room({
      enemies: [
        { archetype: 'rocailleux', x: 5, y: 4 },
        { archetype: 'gelee', x: 1, y: 1, role: 'guerisseur' },
        FAR_GELEE,
      ],
    });
    const run = RoomRun.fromSpec(spec);
    const { health: healer } = enemyAt(run, 1);
    healer.hp = 1;
    const events = play(run, 0, -1);
    expect(events.some((e) => e.type === 'damage')).toBe(true);
    const heals = events.filter((e) => e.type === 'enemyHeal');
    expect(heals).toHaveLength(1);
    expect(enemyAt(run, 0).health.hp).toBe(ENEMY_HP.rocailleux);
    expect(healer.hp).toBe(1);

    // Guérisseur sonné : personne n'est soigné.
    const stunned = RoomRun.fromSpec(room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 4 }, { archetype: 'crapaud', x: 5, y: 2, role: 'guerisseur' }, FAR_GELEE] }));
    const stunnedEvents = play(stunned, 0, -1);
    expect(stunnedEvents.some((e) => e.type === 'stun')).toBe(true);
    expect(stunnedEvents.some((e) => e.type === 'enemyHeal')).toBe(false);
  });

  it('l\'artificier pose un explosif dans sa zone quand elle est libre, jamais sur Dodu', () => {
    const run = RoomRun.fromSpec(room({ enemies: [{ archetype: 'rocailleux', x: 5, y: 2, role: 'artificier' }, FAR_GELEE] }));
    const events = play(run, 1, 0, 0.2);
    const placed = events.find((e) => e.type === 'place');
    expect(placed).toMatchObject({ type: 'place', breakableKind: 'explosive' });
    const boxes = run.sim.world.query(Breakable);
    expect(boxes).toHaveLength(1);
    expect(run.sim.world.require(boxes[0]!, Breakable).breakableKind).toBe('explosive');

    // Dodu immobile dans la zone de pose : rien n'est posé.
    const blocked = RoomRun.fromSpec(room({ hero: { x: 5, y: 3.6 }, enemies: [{ archetype: 'rocailleux', x: 5, y: 2, role: 'artificier' }, FAR_GELEE] }));
    play(blocked, 0, 1, 0.02);
    expect(blocked.sim.world.query(Breakable)).toHaveLength(0);
  });

  it('le bâtisseur pose une caisse devant lui, puis attend que la place se libère', () => {
    const run = RoomRun.fromSpec(room({ hero: { x: 5, y: 9 }, enemies: [{ archetype: 'rocailleux', x: 5, y: 1, role: 'batisseur' }, FAR_GELEE] }));
    const crates = () => run.sim.world.query(Breakable).filter((b) => run.sim.world.require(b, Breakable).breakableKind === 'crate');
    // Lancers mous vers le côté : Dodu reste en bas, la zone de pose en haut est libre.
    play(run, 1, 0, 0.15);
    expect(crates()).toHaveLength(1);
    const [first] = crates();
    expect(run.sim.world.require(first!, Breakable).breakableKind).toBe('crate');
    // La caisse posée occupe la zone : rien de plus au tour suivant.
    play(run, -1, 0, 0.15);
    expect(crates()).toHaveLength(1);
  });

  it('les boîtes posées sont plafonnées par genre', () => {
    const spec = room({
      hero: { x: 5, y: 9 },
      enemies: [{ archetype: 'rocailleux', x: 5, y: 1, role: 'batisseur' }, FAR_GELEE],
      boxes: Array.from({ length: RULES.maxPlacedBoxes }, (_, i) => ({ x: 1 + i * 1.5, y: 9, width: 0.8, height: 0.8, breakable: 'crate' as const })),
    });
    const run = RoomRun.fromSpec(spec);
    play(run, 1, 0, 0.15);
    expect(run.sim.world.query(Breakable)).toHaveLength(RULES.maxPlacedBoxes);
    expect(run.state.log.some((e) => e.type === 'place')).toBe(false);
  });
});

describe('validateur : boucliers et rôles', () => {
  it('accepte deux rôles et un bouclier, refuse trois rôles et le boss décoré', () => {
    const base = JSON.parse(JSON.stringify(GREY_ROOM)) as RoomSpec;
    const ok = {
      ...base,
      enemies: [
        { archetype: 'crapaud', x: 2, y: 2, role: 'guerisseur', shield: true },
        { archetype: 'gelee', x: 5, y: 2, role: 'artificier' },
        { archetype: 'rocailleux', x: 8, y: 2 },
      ],
    };
    expect(validateRoomSpec(ok).enemies[0]).toMatchObject({ role: 'guerisseur', shield: true });
    const three = { ...ok, enemies: [...ok.enemies.slice(0, 2), { archetype: 'rocailleux', x: 8, y: 2, role: 'batisseur' }] };
    expect(() => validateRoomSpec(three)).toThrow(/au plus 2 rôles/);
    const boss = { ...base, enemies: [{ archetype: 'boss', x: 5, y: 3, shield: true }] };
    expect(() => validateRoomSpec(boss)).toThrow(/ni bouclier ni rôle/);
  });
});
