import { defineComponent } from '../core/ecs/world';

/** Nature de jeu d'une entité : `hero`, `dummy` en phase 1, puis les ennemis et objets. */
export interface Kind {
  kind: string;
}

export const Kind = defineComponent<Kind>('kind');
