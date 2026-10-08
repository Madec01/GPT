/**
 * ECS minimal et déterministe.
 *
 * - Une entité est un entier croissant, jamais réutilisé.
 * - Un composant est une donnée simple (objets, tableaux, nombres, chaînes),
 *   sans fonction ni classe : c'est ce qui rend le monde clonable et
 *   sérialisable à l'identique.
 * - Les systèmes sont des fonctions ordinaires appelées dans un ordre fixe par
 *   la simulation ; l'ECS ne gère pas d'ordonnanceur.
 * - Les requêtes renvoient toujours les entités par identifiant croissant,
 *   pour que deux exécutions parcourent le monde dans le même ordre.
 */
export type Entity = number;

export interface ComponentType<T> {
  readonly key: string;
  /** Jamais renseigné : porte seulement le type pour l'inférence. */
  readonly phantom?: T;
}

export function defineComponent<T>(key: string): ComponentType<T> {
  return { key };
}

export class World {
  private nextId = 1;
  private readonly entities = new Set<Entity>();
  private readonly stores = new Map<string, Map<Entity, unknown>>();

  create(): Entity {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  exists(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  destroy(entity: Entity): void {
    if (!this.entities.delete(entity)) return;
    for (const store of this.stores.values()) store.delete(entity);
  }

  /** Ajoute ou remplace un composant. */
  add<T>(entity: Entity, type: ComponentType<T>, data: T): T {
    if (!this.entities.has(entity)) throw new Error(`Entité inconnue : ${entity}`);
    let store = this.stores.get(type.key);
    if (!store) {
      store = new Map();
      this.stores.set(type.key, store);
    }
    store.set(entity, data);
    return data;
  }

  get<T>(entity: Entity, type: ComponentType<T>): T | undefined {
    return this.stores.get(type.key)?.get(entity) as T | undefined;
  }

  /** Comme `get`, mais lance si le composant est absent : à utiliser quand l'absence est un bug. */
  require<T>(entity: Entity, type: ComponentType<T>): T {
    const data = this.get(entity, type);
    if (data === undefined) throw new Error(`Composant ${type.key} absent sur l'entité ${entity}`);
    return data;
  }

  has(entity: Entity, type: ComponentType<unknown>): boolean {
    return this.stores.get(type.key)?.has(entity) ?? false;
  }

  remove(entity: Entity, type: ComponentType<unknown>): boolean {
    return this.stores.get(type.key)?.delete(entity) ?? false;
  }

  /** Entités possédant tous les composants demandés, par identifiant croissant. */
  query(...types: ComponentType<unknown>[]): Entity[] {
    if (types.length === 0) return [...this.entities].sort((a, b) => a - b);
    const stores = types.map((t) => this.stores.get(t.key));
    if (stores.some((s) => s === undefined)) return [];
    const [first, ...rest] = stores as Map<Entity, unknown>[];
    const result: Entity[] = [];
    for (const entity of first!.keys()) {
      if (rest.every((s) => s.has(entity))) result.push(entity);
    }
    return result.sort((a, b) => a - b);
  }

  count(): number {
    return this.entities.size;
  }

  /** Copie profonde ; les composants doivent être des données simples. */
  clone(): World {
    const copy = new World();
    copy.nextId = this.nextId;
    for (const entity of this.entities) copy.entities.add(entity);
    for (const [key, store] of this.stores) {
      const storeCopy = new Map<Entity, unknown>();
      for (const [entity, data] of store) storeCopy.set(entity, structuredClone(data));
      copy.stores.set(key, storeCopy);
    }
    return copy;
  }

  /**
   * Sérialisation stable : entités et clés triées. Deux mondes identiques
   * produisent la même chaîne, ce qui sert de preuve de déterminisme.
   */
  snapshot(): string {
    const keys = [...this.stores.keys()].sort();
    const entities = [...this.entities].sort((a, b) => a - b).map((id) => {
      const components: Record<string, unknown> = {};
      for (const key of keys) {
        const store = this.stores.get(key)!;
        if (store.has(id)) components[key] = store.get(id);
      }
      return { id, components };
    });
    return stableStringify({ nextId: this.nextId, entities });
  }
}

/** JSON avec clés d'objet triées récursivement. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[k] = (v as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return v;
  });
}
