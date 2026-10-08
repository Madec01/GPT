/**
 * Geste de visée en fronde, en pixels d'écran.
 *
 * On pose le doigt n'importe où, on tire en arrière, on relâche : le héros
 * part dans la direction opposée au glissement, avec une puissance
 * proportionnelle à sa longueur. Un petit disque autour du point de contact,
 * la zone morte, n'arme rien ; y revenir annule le geste.
 *
 * Machine d'état pure : aucune dépendance au DOM, testable en Node.
 */
export interface GestureConfig {
  /** Rayon de la zone morte, en pixels. */
  deadZone: number;
  /** Distance de tir maximale, en pixels. Au-delà, la puissance plafonne à 1. */
  maxRadius: number;
}

export const DEFAULT_GESTURE: GestureConfig = { deadZone: 24, maxRadius: 140 };

export interface AimState {
  active: boolean;
  /** Vrai dès que le doigt a quitté la zone morte. */
  armed: boolean;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  /** Direction de lancer unitaire, nulle si non armé. */
  dirX: number;
  dirY: number;
  /** Puissance dans [0, 1]. */
  power: number;
}

export interface PointerInput {
  type: 'down' | 'move' | 'up' | 'cancel';
  id: number;
  x: number;
  y: number;
}

export type GestureEvent =
  | { type: 'aim'; aim: AimState }
  | { type: 'throw'; dirX: number; dirY: number; power: number }
  | { type: 'cancel' };

const IDLE: AimState = {
  active: false,
  armed: false,
  originX: 0,
  originY: 0,
  currentX: 0,
  currentY: 0,
  dirX: 0,
  dirY: 0,
  power: 0,
};

/** Calcule l'état de visée pour un point d'origine et une position courante. */
export function aimFromPoints(
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
  config: GestureConfig = DEFAULT_GESTURE,
): AimState {
  const dx = originX - currentX;
  const dy = originY - currentY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= config.deadZone) {
    return { ...IDLE, active: true, originX, originY, currentX, currentY };
  }
  const span = Math.max(1, config.maxRadius - config.deadZone);
  const power = Math.min(1, (dist - config.deadZone) / span);
  return {
    active: true,
    armed: true,
    originX,
    originY,
    currentX,
    currentY,
    dirX: dx / dist,
    dirY: dy / dist,
    power,
  };
}

export class AimGesture {
  private pointerId: number | null = null;
  private state: AimState = IDLE;

  constructor(private readonly config: GestureConfig = DEFAULT_GESTURE) {}

  get aim(): AimState {
    return this.state;
  }

  /** Vrai pendant qu'un doigt vise. */
  get active(): boolean {
    return this.state.active;
  }

  reset(): void {
    this.pointerId = null;
    this.state = IDLE;
  }

  /** Traite un événement de pointeur ; renvoie l'événement de geste produit, ou `null`. */
  handle(input: PointerInput): GestureEvent | null {
    switch (input.type) {
      case 'down': {
        if (this.pointerId !== null) return null;
        this.pointerId = input.id;
        this.state = aimFromPoints(input.x, input.y, input.x, input.y, this.config);
        return { type: 'aim', aim: this.state };
      }
      case 'move': {
        if (input.id !== this.pointerId) return null;
        this.state = aimFromPoints(this.state.originX, this.state.originY, input.x, input.y, this.config);
        return { type: 'aim', aim: this.state };
      }
      case 'up': {
        if (input.id !== this.pointerId) return null;
        const final = aimFromPoints(this.state.originX, this.state.originY, input.x, input.y, this.config);
        this.reset();
        if (!final.armed) return { type: 'cancel' };
        return { type: 'throw', dirX: final.dirX, dirY: final.dirY, power: final.power };
      }
      case 'cancel': {
        if (input.id !== this.pointerId) return null;
        this.reset();
        return { type: 'cancel' };
      }
    }
  }
}
