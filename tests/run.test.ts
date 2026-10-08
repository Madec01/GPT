import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/math/rng';
import { CHARMS, charmById, MAX_CHARMS, modifiersFor } from '../src/run/charms';
import { drawEvent, EVENTS, eventById } from '../src/run/events';
import { FLOORS, generateAct, nextNodes, startNodes } from '../src/run/map';
import { buyCharm, buyHeal, HEAL_PRICE, makeShop, reroll, REROLL_PRICE } from '../src/run/shop';
import {
  canRevive, chooseCharm, completeCombat, leaveNode, moveTo, newRun, parseRunState, pickRoom, reachable, rest, summary, takeCharm, useRevive,
} from '../src/run/state';

describe('carte d\'acte', () => {
  it('est déterministe, connexe de haut en bas, typée par étage et sans chemins croisés', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const a = generateAct(createRng(seed), 1);
      const b = generateAct(createRng(seed), 1);
      expect(b).toEqual(a);
      const floors = new Map<number, typeof a.nodes>();
      for (const n of a.nodes) floors.set(n.floor, [...(floors.get(n.floor) ?? []), n]);
      expect([...floors.keys()].sort((x, y) => x - y)).toEqual(Array.from({ length: FLOORS }, (_, i) => i + 1));
      for (const n of a.nodes) {
        if (n.floor === 1) expect(n.type).toBe('combat');
        if (n.floor === FLOORS - 1) expect(n.type).toBe('repos');
        if (n.floor === FLOORS) expect(n.type).toBe('boss');
        if (n.floor === 2) expect(n.type).not.toBe('elite');
        if (n.floor < FLOORS) expect(n.next.length).toBeGreaterThan(0);
        else expect(n.next).toEqual([]);
        for (const next of nextNodes(a, n.id)) {
          expect(next.floor).toBe(n.floor + 1);
          expect(Math.abs(next.column - n.column)).toBeLessThanOrEqual(1);
          if (n.type === 'repos') expect(next.type === 'repos' && next.floor !== FLOORS - 1).toBe(false);
        }
      }
      expect(a.nodes.filter((n) => n.type === 'marchand').length).toBeLessThanOrEqual(1);
      expect(a.nodes.filter((n) => n.floor === FLOORS)).toHaveLength(1);
      // Aucun croisement : deux arêtes d'un même étage ne s'inversent pas.
      for (let floor = 1; floor < FLOORS; floor++) {
        const edges = a.nodes.filter((n) => n.floor === floor).flatMap((n) => nextNodes(a, n.id).map((m) => [n.column, m.column] as const));
        for (const [c1, d1] of edges) for (const [c2, d2] of edges) expect((c1 < c2 && d1 > d2) || (c1 > c2 && d1 < d2)).toBe(false);
      }
      // Tout nœud est atteignable depuis le premier étage.
      const seen = new Set(startNodes(a).map((n) => n.id));
      for (const n of a.nodes) if (seen.has(n.id)) for (const m of n.next) seen.add(m);
      expect(seen.size).toBe(a.nodes.length);
    }
  });
});

describe('état de run', () => {
  it('démarre nu, avance de nœud en nœud, change d\'acte après le boss et gagne après le troisième', () => {
    const state = newRun(42);
    expect(state).toMatchObject({ act: 1, hp: 3, maxHp: 3, charms: [], plumes: 0, phase: 'map' });
    expect(reachable(state).every((n) => n.floor === 1)).toBe(true);
    for (let act = 1; act <= 3; act++) {
      expect(state.act).toBe(act);
      let node = moveTo(state, reachable(state)[0]!.id);
      expect(() => moveTo(state, node.id)).toThrow();
      leaveNode(state);
      while (node.type !== 'boss') {
        node = moveTo(state, reachable(state)[0]!.id);
        leaveNode(state);
      }
    }
    expect(state.phase).toBe('won');
    expect(summary(state).won).toBe(true);
  });

  it('compte un combat : plumes, statistiques, récompense selon le nœud', () => {
    const state = newRun(7);
    const base = { hp: 2, charge: 1, form: 'none', element: 'none', kills: 2, turns: 3, damageTaken: 1, contractDone: true, elite: false, boss: false } as const;
    expect(completeCombat(state, { ...base }).plumes).toBe(40);
    expect(state).toMatchObject({ hp: 2, charge: 1, plumes: 40 });
    expect(state.reward).toBeNull();
    expect(completeCombat(state, { ...base, elite: true }).reward?.kind).toBe('charm');
    takeCharm(state, 'aimant-a-plumes');
    expect(completeCombat(state, { ...base, contractDone: false }).plumes).toBe(45);
    expect(completeCombat(state, { ...base, boss: true }).reward).toEqual({ kind: 'form' });
    state.act = 2;
    expect(completeCombat(state, { ...base, boss: true }).reward).toEqual({ kind: 'element' });
    const final = completeCombat(state, { ...base, boss: true, element: 'electricite' }).reward;
    expect(final?.kind).toBe('charm');
    if (final?.kind === 'charm') {
      expect(final.options).toHaveLength(3);
      expect(final.options).not.toContain('aimant-a-plumes');
      chooseCharm(state, final.options[0]!);
      expect(state.charms).toHaveLength(2);
    }
    expect(state.reward).toBeNull();
  });

  it('tire les salles sans répétition et retombe sur le vivier entier une fois épuisé', () => {
    const state = newRun(3);
    const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const picks = [pickRoom(state, pool).id, pickRoom(state, pool).id, pickRoom(state, pool).id];
    expect([...picks].sort()).toEqual(['a', 'b', 'c']);
    expect(pool.map((p) => p.id)).toContain(pickRoom(state, pool).id);
  });

  it('plafonne les charmes, soigne ou veille au repos, offre une seconde vie une fois', () => {
    const state = newRun(9);
    for (const c of CHARMS) takeCharm(state, c.id);
    expect(state.charms).toHaveLength(MAX_CHARMS);
    expect(takeCharm(state, 'lanterne')).toBe(false);
    state.hp = 1;
    rest(state, 'soigner');
    expect(state.hp).toBe(3);
    rest(state, 'veiller');
    expect(state).toMatchObject({ hp: 4, maxHp: 4 });
    expect(canRevive(state)).toBe(true);
    expect(useRevive(state)).toBe(true);
    expect(state.hp).toBe(1);
    expect(useRevive(state)).toBe(false);
  });

  it('se sauvegarde et se relit tel quel, et rejette une sauvegarde abîmée', () => {
    const state = newRun(11);
    moveTo(state, reachable(state)[0]!.id);
    takeCharm(state, 'grelot');
    const copy = parseRunState(JSON.parse(JSON.stringify(state)));
    expect(copy).toEqual(state);
    expect(parseRunState({ ...state, version: 1 })).toBeNull();
    expect(parseRunState({ ...state, charms: ['inconnu'] })).toBeNull();
    expect(parseRunState({ ...state, hp: 99 })).toBeNull();
    expect(parseRunState(null)).toBeNull();
  });
});

describe('charmes, marchand et événements', () => {
  it('traduit les charmes en règles', () => {
    const mods = modifiersFor(['plume-de-plomb', 'grelot', 'corde-double', 'tambour-de-guerre'], 4, true);
    expect(mods).toMatchObject({ maxHp: 4, heroMassScale: 2, crateBreakSpeed: 3, stunDisplacement: 0.5, throwsPerTurn: 2, chargeMax: 2, enemyHpBonus: 1 });
    expect(modifiersFor([], 3).heroRestitution).toBeNull();
    expect(modifiersFor(['bille-de-verre'], 3).heroRestitution).toBe(0.95);
    expect(charmById('lanterne').rarity).toBe('commun');
  });

  it('vend des charmes et un soin, relance l\'offre une fois', () => {
    const state = newRun(5);
    const shop = makeShop(state);
    expect(shop.charms).toHaveLength(3);
    expect(buyCharm(state, shop, 0)).toBe(false);
    state.plumes = 200;
    const first = shop.charms[0]!;
    expect(buyCharm(state, shop, 0)).toBe(true);
    expect(state.charms).toEqual([first.id]);
    expect(state.plumes).toBe(200 - first.price);
    expect(buyCharm(state, shop, 0)).toBe(false);
    expect(buyHeal(state, shop)).toBe(false);
    state.hp = 1;
    const before = state.plumes;
    expect(buyHeal(state, shop)).toBe(true);
    expect(state).toMatchObject({ hp: 2, plumes: before - HEAL_PRICE });
    expect(reroll(state, shop)).toBe(true);
    expect(shop.charms.every((c) => !c.sold && c.id !== first.id)).toBe(true);
    expect(state.plumes).toBe(before - HEAL_PRICE - REROLL_PRICE);
    expect(reroll(state, shop)).toBe(false);
  });

  it('tire les événements sans répétition et applique leurs choix', () => {
    const state = newRun(13);
    const seen = new Set<string>();
    for (let i = 0; i < EVENTS.length; i++) seen.add(drawEvent(state, createRng(i)).id);
    expect(seen.size).toBe(EVENTS.length);
    const autel = eventById('autel');
    const text = autel.choices[0]!.apply(state, createRng(1));
    expect(state.hp).toBe(2);
    expect(text).toMatch(/Vous recevez|mains restent vides/);
    const fontaine = eventById('fontaine');
    expect(fontaine.choices[0]!.apply(state, createRng(1))).toContain('cœur');
    expect(state.hp).toBe(3);
    eventById('piege').choices[0]!.apply(state, createRng(1));
    expect(state).toMatchObject({ plumes: 60, nextCombatElite: true });
    eventById('forge').choices[1]!.apply(state, createRng(1));
    expect(state.form).toBe('rebond');
  });
});
