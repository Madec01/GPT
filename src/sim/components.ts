import { defineComponent } from '../core/ecs/world';
import type { Archetype, PushableKind } from './archetypes';
import type { Zone } from './zones';

/** Nature d'une entité pour le rendu et les règles : hero, crapaud, egg, crate, pickup... */
export interface Kind {
  kind: string;
}

export interface Health {
  hp: number;
  max: number;
}

/** Intention d'attaque : un motif nommé et ses zones figées au sol. */
export interface Intent {
  pattern: string;
  zones: Zone[];
}

export interface Enemy {
  archetype: Archetype;
  /** Position au début du tour, pour mesurer le déplacement et le sonné. */
  turnStartX: number;
  turnStartY: number;
  stunned: boolean;
  intent: Intent | null;
  /** Index dans le cycle d'attaques, pour le boss. */
  cycleIndex: number;
}

export interface Pushable {
  pushableKind: PushableKind;
  startX: number;
  startY: number;
}

export type BreakableKind = 'crate' | 'barricade' | 'column' | 'explosive';

/** Boîte cassable. Une colonne possède une zone d'éboulement ; un explosif éclate en chaîne. */
export interface Breakable {
  breakableKind: BreakableKind;
  collapse: Zone | null;
  /** Impacts restants avant rupture ; visible par les fissures. */
  solidity: number;
  maxSolidity: number;
}

/** Tremplin : rectangle au sol qui pousse tout cercle qui le traverse. */
export interface Springboard {
  zone: Zone;
  dirX: number;
  dirY: number;
  impulse: number;
  /** Corps actuellement dessus, pour ne pousser qu'une fois par traversée. */
  inside: number[];
}

export interface Hazard {
  hazardKind: 'pit';
  zone: Zone;
}

export interface Pickup {
  pickupKind: 'heart';
  x: number;
  y: number;
  r: number;
}

export type HeroForm = 'none' | 'pierre' | 'rebond' | 'glu';
export type HeroElement = 'none' | 'electricite';

export interface Hero {
  hp: number;
  maxHp: number;
  brakeAvailable: boolean;
  charge: number;
  chargeMax: number;
  form: HeroForm;
  element: HeroElement;
  /** Vrai pendant un lancer en version forte. */
  strongThrow: boolean;
  /** Forme gluante : vrai une fois Dodu ancré pendant ce lancer. */
  anchored: boolean;
  /** Vrai si l'ancrage s'est fait sur un ennemi, pour la synergie Glu et Électricité. */
  anchoredOnEnemy: boolean;
  /** La version forte ne traverse qu'un seul obstacle par lancer. */
  strongPassUsed: boolean;
  throwOriginX: number;
  throwOriginY: number;
  /** Dernier pas avec un contact, pour l'accélération automatique. */
  lastContactStep: number;
}

export type Objective = { type: 'eliminate' } | { type: 'push'; object: number; goal: Zone };

export type RoomPhase = 'aim' | 'moving' | 'won' | 'lost';

/** État de la salle, porté par une entité singleton pour être cloné avec le monde. */
export interface RoomState {
  turn: number;
  phase: RoomPhase;
  rngState: number;
  objective: Objective;
  /** Journal des événements de règles du pas courant, vidé par l'orchestrateur. */
  log: RuleEvent[];
  /** Mode test : Dodu ne perd jamais de point de vie. */
  invincible?: boolean;
}

export type RuleEvent =
  | { type: 'damage'; entity: number; amount: number; x: number; y: number }
  | { type: 'death'; entity: number; kind: string; x: number; y: number }
  | { type: 'break'; entity: number; breakableKind: BreakableKind; x: number; y: number }
  | { type: 'crack'; entity: number; remaining: number; x: number; y: number }
  | { type: 'explosion'; x: number; y: number; r: number }
  | { type: 'bumper'; x: number; y: number }
  | { type: 'stick'; x: number; y: number }
  | { type: 'charge'; value: number; max: number }
  | { type: 'spring'; entity: number; x: number; y: number }
  | { type: 'fall'; entity: number; kind: string; x: number; y: number }
  | { type: 'heal'; amount: number }
  | { type: 'loot'; x: number; y: number }
  | { type: 'heroHit'; amount: number; entity: number }
  | { type: 'stun'; entity: number }
  | { type: 'arc'; fromX: number; fromY: number; toX: number; toY: number; entity: number }
  | { type: 'anchor'; x: number; y: number }
  | { type: 'turn'; turn: number }
  | { type: 'won' }
  | { type: 'lost' };

export const Kind = defineComponent<Kind>('kind');
export const Health = defineComponent<Health>('health');
export const Enemy = defineComponent<Enemy>('enemy');
export const Pushable = defineComponent<Pushable>('pushable');
export const Breakable = defineComponent<Breakable>('breakable');
export const Springboard = defineComponent<Springboard>('springboard');
export const Hazard = defineComponent<Hazard>('hazard');
export const Pickup = defineComponent<Pickup>('pickup');
export const Hero = defineComponent<Hero>('hero');
export const RoomState = defineComponent<RoomState>('roomState');
