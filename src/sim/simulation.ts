/**
 * Simulation d'une salle : enchaîne les pas de physique à cadence fixe,
 * reçoit les entrées du joueur et tient le journal qui permet de rejouer la
 * partie à l'identique.
 *
 * La simulation ignore tout du rendu, du navigateur et de l'horloge réelle.
 */
import type { Entity, World } from '../core/ecs/world';
import { stableStringify } from '../core/ecs/world';
import {
  CircleBody,
  DEFAULT_PHYSICS,
  isAtRest,
  physicsStep,
  Transform,
  Velocity,
  type ContactEvent,
  type ContactHook,
  type PhysicsConfig,
} from '../core/physics';
import { buildRoom, type RoomSpec } from './room';

export interface SimConfig extends PhysicsConfig {
  /** Vitesse de lancer à puissance maximale, en unités par seconde. */
  launchSpeed: number;
  /** Garde-fou : nombre de pas maximal d'un lancer avant arrêt forcé. */
  maxStepsPerThrow: number;
}

export const DEFAULT_SIM: SimConfig = {
  ...DEFAULT_PHYSICS,
  launchSpeed: 14,
  maxStepsPerThrow: 120 * 20,
};

export type SimPhase = 'idle' | 'moving';

/** Système exécuté après la physique à chaque pas, dans l'ordre d'enregistrement. */
export type TickSystem = (world: World, step: number) => void;

export type SimInput =
  | { step: number; type: 'throw'; vx: number; vy: number }
  | { step: number; type: 'brake' };

export class Simulation {
  step = 0;
  phase: SimPhase = 'idle';
  /** Pas auquel le lancer en cours a commencé, pour le garde-fou. */
  private movingSince = 0;
  readonly inputs: SimInput[] = [];
  readonly events: ContactEvent[] = [];

  constructor(
    readonly world: World,
    readonly hero: Entity,
    readonly config: SimConfig = DEFAULT_SIM,
    private readonly hook?: ContactHook,
    private readonly systems: readonly TickSystem[] = [],
  ) {}

  static fromRoom(
    spec: RoomSpec,
    config: SimConfig = DEFAULT_SIM,
    hook?: ContactHook,
    systems: readonly TickSystem[] = [],
  ): Simulation {
    const { world, hero } = buildRoom(spec);
    return new Simulation(world, hero, config, hook, systems);
  }

  /** Lance le héros avec la vitesse donnée. Refusé si un lancer est en cours. */
  throwHero(vx: number, vy: number): boolean {
    if (this.phase !== 'idle') return false;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed === 0) return false;
    const k = speed > this.config.maxSpeed ? this.config.maxSpeed / speed : 1;
    const velocity = this.world.require(this.hero, Velocity);
    velocity.x = vx * k;
    velocity.y = vy * k;
    this.phase = 'moving';
    this.movingSince = this.step;
    this.inputs.push({ step: this.step, type: 'throw', vx: velocity.x, vy: velocity.y });
    return true;
  }

  /** Immobilise le héros sur place. Les règles de jeu limitent son usage. */
  brake(): boolean {
    if (this.phase !== 'moving') return false;
    const velocity = this.world.require(this.hero, Velocity);
    velocity.x = 0;
    velocity.y = 0;
    this.inputs.push({ step: this.step, type: 'brake' });
    return true;
  }

  /** Avance d'un pas de simulation. */
  tick(): ContactEvent[] {
    const events = physicsStep(this.world, this.config, this.step, this.hook);
    for (const event of events) this.events.push(event);
    for (const system of this.systems) system(this.world, this.step);
    this.step++;
    if (this.phase === 'moving') {
      const exhausted = this.step - this.movingSince >= this.config.maxStepsPerThrow;
      if (exhausted) this.freezeAll();
      if (exhausted || isAtRest(this.world)) this.phase = 'idle';
    }
    return events;
  }

  /** Fait avancer jusqu'à l'immobilisation ou le garde-fou. Retourne le nombre de pas joués. */
  runUntilRest(): number {
    const start = this.step;
    while (this.phase === 'moving') this.tick();
    return this.step - start;
  }

  heroTransform(): Transform {
    return this.world.require(this.hero, Transform);
  }

  heroRadius(): number {
    return this.world.require(this.hero, CircleBody).radius;
  }

  /** Copie indépendante : même configuration, même état, journal d'entrées copié, événements remis à zéro. */
  clone(): Simulation {
    const copy = new Simulation(this.world.clone(), this.hero, this.config, this.hook, this.systems);
    copy.step = this.step;
    copy.phase = this.phase;
    copy.movingSince = this.movingSince;
    copy.inputs.push(...this.inputs);
    return copy;
  }

  /** Empreinte stable de l'état complet, pour les preuves de déterminisme. */
  snapshot(): string {
    return stableStringify({ step: this.step, phase: this.phase, world: JSON.parse(this.world.snapshot()) });
  }

  private freezeAll(): void {
    for (const entity of this.world.query(Velocity)) {
      const v = this.world.require(entity, Velocity);
      v.x = 0;
      v.y = 0;
    }
  }
}
