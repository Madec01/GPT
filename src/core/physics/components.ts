import { defineComponent } from '../ecs/world';

/** Position du centre, en unités d'arène (le diamètre du héros vaut 1). */
export interface Transform {
  x: number;
  y: number;
}

/** Vitesse en unités par seconde. */
export interface Velocity {
  x: number;
  y: number;
}

/**
 * Corps mobile : toujours un cercle.
 * `rollingDecel` est la décélération constante de roulement, en unités par seconde carrée.
 */
export interface CircleBody {
  radius: number;
  mass: number;
  restitution: number;
  rollingDecel: number;
}

/** Segment statique orienté de A vers B ; les deux faces sont solides. */
export interface SegmentBody {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  restitution: number;
}

/**
 * Boîte statique alignée sur les axes, centrée sur son Transform.
 * Elle ne collisionne pas elle-même : la construction de la salle lui crée
 * quatre segments enfants. Elle sert au rendu et aux règles de jeu.
 */
export interface BoxShape {
  halfWidth: number;
  halfHeight: number;
}

/** Lien d'un segment vers la boîte dont il est une face. */
export interface SegmentOwner {
  owner: number;
}

export const Transform = defineComponent<Transform>('transform');
export const Velocity = defineComponent<Velocity>('velocity');
export const CircleBody = defineComponent<CircleBody>('circleBody');
export const SegmentBody = defineComponent<SegmentBody>('segmentBody');
export const BoxShape = defineComponent<BoxShape>('boxShape');
export const SegmentOwner = defineComponent<SegmentOwner>('segmentOwner');
