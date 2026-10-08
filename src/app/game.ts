/**
 * Colle entre la simulation, le geste et le rendu. Le temps réel est converti
 * en pas fixes par un accumulateur ; la simulation ne voit jamais de
 * millisecondes.
 */
import type { Vec2 } from '../core/math/vec2';
import { AimGesture, type AimState, type GestureEvent, type PointerInput } from '../input/gesture';
import { disclose, DEFAULT_DISCLOSURE, type DisclosurePolicy } from '../render/disclosure';
import type { PixiRenderer } from '../render/pixiRenderer';
import { predictThrow, type Prediction } from '../sim/lookahead';
import type { RoomSpec } from '../sim/room';
import { DEFAULT_SIM, Simulation, type SimConfig } from '../sim/simulation';

export interface GameOptions {
  sim?: SimConfig;
  disclosure?: DisclosurePolicy;
  /** Plafond de temps simulé par image, pour ne pas rattraper une longue pause d'onglet. */
  maxFrameMs?: number;
}

export class Game {
  readonly sim: Simulation;
  readonly gesture = new AimGesture();
  private readonly disclosure: DisclosurePolicy;
  private readonly maxFrameMs: number;
  private accumulatorMs = 0;
  private prediction: Prediction | null = null;
  private predictionKey = '';
  private trail: Vec2[] | null = null;
  private trailStep = 0;
  /** Compteur de lancers, exposé au test de fumée. */
  throwCount = 0;

  constructor(
    readonly spec: RoomSpec,
    private readonly renderer: PixiRenderer,
    options: GameOptions = {},
  ) {
    this.sim = Simulation.fromRoom(spec, options.sim ?? DEFAULT_SIM);
    this.disclosure = options.disclosure ?? DEFAULT_DISCLOSURE;
    this.maxFrameMs = options.maxFrameMs ?? 100;
    this.renderer.drawStatics(this.sim.world);
  }

  /** Branche les événements de pointeur du canvas sur le geste de visée. */
  attachPointer(canvas: HTMLCanvasElement): void {
    const toInput = (type: PointerInput['type'], e: PointerEvent): PointerInput => {
      const rect = canvas.getBoundingClientRect();
      return { type, id: e.pointerId, x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.sim.phase !== 'idle') return;
      canvas.setPointerCapture(e.pointerId);
      this.onGesture(this.gesture.handle(toInput('down', e)));
    });
    canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      this.onGesture(this.gesture.handle(toInput('move', e)));
    });
    canvas.addEventListener('pointerup', (e) => {
      e.preventDefault();
      this.onGesture(this.gesture.handle(toInput('up', e)));
    });
    canvas.addEventListener('pointercancel', (e) => {
      this.onGesture(this.gesture.handle(toInput('cancel', e)));
    });
  }

  /** Lance le héros avec une direction unitaire et une puissance dans [0, 1]. */
  throwFromAim(dirX: number, dirY: number, power: number): boolean {
    const speed = power * this.sim.config.launchSpeed;
    const accepted = this.sim.throwHero(dirX * speed, dirY * speed);
    if (accepted) {
      this.throwCount++;
      this.prediction = null;
      this.predictionKey = '';
      const t = this.sim.heroTransform();
      this.trail = [{ x: t.x, y: t.y }];
      this.trailStep = this.sim.step;
    }
    return accepted;
  }

  /** Avance la simulation du temps écoulé et redessine. */
  update(deltaMs: number): void {
    this.accumulatorMs += Math.min(deltaMs, this.maxFrameMs);
    const stepMs = this.sim.config.dt * 1000;
    while (this.accumulatorMs >= stepMs) {
      this.accumulatorMs -= stepMs;
      if (this.sim.phase === 'moving') {
        const events = this.sim.tick();
        this.recordTrail(events.some((e) => e.a === this.sim.hero || e.b === this.sim.hero));
      }
    }
    this.render();
  }

  private recordTrail(heroContact: boolean): void {
    if (!this.trail) return;
    const t = this.sim.heroTransform();
    const sampled = (this.sim.step - this.trailStep) % 4 === 0;
    if (heroContact || sampled || this.sim.phase === 'idle') this.trail.push({ x: t.x, y: t.y });
  }

  private onGesture(event: GestureEvent | null): void {
    if (!event) return;
    switch (event.type) {
      case 'aim':
        this.updatePrediction(event.aim);
        break;
      case 'throw':
        this.throwFromAim(event.dirX, event.dirY, event.power);
        break;
      case 'cancel':
        this.prediction = null;
        this.predictionKey = '';
        break;
    }
  }

  /** Recalcule la prédiction seulement quand la visée change de façon perceptible. */
  private updatePrediction(aim: AimState): void {
    if (!aim.armed || this.sim.phase !== 'idle') {
      this.prediction = null;
      this.predictionKey = '';
      return;
    }
    const key = `${Math.round(aim.dirX * 200)}:${Math.round(aim.dirY * 200)}:${Math.round(aim.power * 100)}`;
    if (key === this.predictionKey) return;
    this.predictionKey = key;
    const speed = aim.power * this.sim.config.launchSpeed;
    this.prediction = predictThrow(this.sim, aim.dirX * speed, aim.dirY * speed);
  }

  private render(): void {
    this.renderer.drawTrail(this.trail);
    this.renderer.drawDynamics(this.sim.world, this.sim.hero);
    const preview = this.prediction && this.gesture.active ? disclose(this.prediction, this.disclosure) : null;
    this.renderer.drawPreview(preview, this.sim.heroRadius());
    this.renderer.drawAimIndicator(this.gesture.active ? this.gesture.aim : null);
  }

  /** État lisible par les tests de bout en bout. */
  debugState(): { phase: string; step: number; throws: number; hero: Vec2; inputs: number } {
    const t = this.sim.heroTransform();
    return {
      phase: this.sim.phase,
      step: this.sim.step,
      throws: this.throwCount,
      hero: { x: t.x, y: t.y },
      inputs: this.sim.inputs.length,
    };
  }
}
