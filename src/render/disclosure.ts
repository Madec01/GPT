import type { Vec2 } from '../core/math/vec2';
import type { Prediction } from '../sim/lookahead';

/**
 * Politique de divulgation de l'aide à la visée. La simulation connaît tout ;
 * ce module décide ce que l'on montre. Valeurs par défaut du GDD : premier
 * segment exact, arrêt exact sans contact mobile, halo incertain sinon.
 */
export interface DisclosurePolicy {
  showFirstSegment: boolean;
  /** Montre tout le trajet, réservé au mode test. */
  showFullPath: boolean;
  exactStopWithoutDynamicContact: boolean;
  /** Rayon du halo d'incertitude, en unités d'arène. */
  uncertainHaloRadius: number;
}

export const DEFAULT_DISCLOSURE: DisclosurePolicy = {
  showFirstSegment: true,
  showFullPath: false,
  exactStopWithoutDynamicContact: true,
  uncertainHaloRadius: 1,
};

export interface DisclosedPreview {
  /** Segment visible : du départ au premier contact, ou au point d'arrêt. */
  segment: Vec2[];
  stop: Vec2;
  uncertain: boolean;
  haloRadius: number;
}

export function disclose(prediction: Prediction, policy: DisclosurePolicy = DEFAULT_DISCLOSURE): DisclosedPreview {
  const start = prediction.path[0]!;
  let segment: Vec2[];
  if (policy.showFullPath) segment = prediction.path;
  else if (policy.showFirstSegment) segment = [start, prediction.firstContact ?? prediction.stop];
  else segment = [];
  const uncertain = policy.exactStopWithoutDynamicContact ? prediction.touchedDynamic : true;
  return { segment, stop: prediction.stop, uncertain, haloRadius: uncertain ? policy.uncertainHaloRadius : 0 };
}
