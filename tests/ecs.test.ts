import { describe, expect, it } from 'vitest';
import { defineComponent, stableStringify, World } from '../src/core/ecs/world';

interface Position {
  x: number;
  y: number;
}
const Position = defineComponent<Position>('position');
const Tag = defineComponent<{ name: string }>('tag');

describe('World', () => {
  it('crée des entités aux identifiants croissants, jamais réutilisés', () => {
    const w = new World();
    const a = w.create();
    const b = w.create();
    w.destroy(a);
    const c = w.create();
    expect([a, b, c]).toEqual([1, 2, 3]);
    expect(w.exists(a)).toBe(false);
    expect(w.count()).toBe(2);
  });

  it('renvoie les requêtes par identifiant croissant quel que soit l\'ordre d\'ajout', () => {
    const w = new World();
    const ids = [w.create(), w.create(), w.create()];
    w.add(ids[2]!, Position, { x: 0, y: 0 });
    w.add(ids[0]!, Position, { x: 0, y: 0 });
    w.add(ids[1]!, Position, { x: 0, y: 0 });
    w.add(ids[1]!, Tag, { name: 'b' });
    w.add(ids[2]!, Tag, { name: 'c' });
    expect(w.query(Position)).toEqual([1, 2, 3]);
    expect(w.query(Position, Tag)).toEqual([2, 3]);
    expect(w.query(Tag, Position)).toEqual([2, 3]);
  });

  it('require lance sur un composant absent', () => {
    const w = new World();
    const e = w.create();
    expect(() => w.require(e, Position)).toThrow(/absent/);
    expect(() => w.add(99, Position, { x: 0, y: 0 })).toThrow(/inconnue/);
  });

  it('clone profondément : modifier la copie ne touche pas l\'original', () => {
    const w = new World();
    const e = w.create();
    const pos = w.add(e, Position, { x: 1, y: 2 });
    const copy = w.clone();
    copy.require(e, Position).x = 42;
    expect(pos.x).toBe(1);
    expect(copy.create()).toBe(w.create());
  });

  it('produit un instantané stable, indépendant de l\'ordre d\'insertion des clés', () => {
    const w1 = new World();
    const w2 = new World();
    const e1 = w1.create();
    const e2 = w2.create();
    w1.add(e1, Position, { x: 1, y: 2 });
    w2.add(e2, Position, { y: 2, x: 1 } as Position);
    expect(w1.snapshot()).toBe(w2.snapshot());
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });
});
