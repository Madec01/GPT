/**
 * Colle entre la campagne, la salle en cours, le geste et le rendu. Le temps
 * réel est converti en pas fixes par un accumulateur, modulé par l'échelle de
 * temps (accélération automatique, tap pour passer, ralenti court). La
 * simulation ne voit jamais de millisecondes.
 */
import type { Vec2 } from '../core/math/vec2';
import { nodeOf, type Campaign, type CampaignNode } from '../data/campaign';
import { AimGesture, type AimState, type GestureEvent, type PointerInput } from '../input/gesture';
import { disclose, DEFAULT_DISCLOSURE, type DisclosedPreview, type DisclosurePolicy } from '../render/disclosure';
import type { MarkerState, PixiRenderer, ZoneDrawing } from '../render/pixiRenderer';
import { Enemy, type RuleEvent } from '../sim/components';
import type { Prediction } from '../sim/lookahead';
import { DEFAULT_CARRY, type HeroCarry } from '../sim/room';
import { predictRoomThrow, RoomRun } from '../sim/rules/turn';
import { DEFAULT_SIM, type SimConfig } from '../sim/simulation';
import { circleIntersectsZone } from '../sim/zones';

export interface GameOptions {
  sim?: SimConfig;
  disclosure?: DisclosurePolicy;
  /** Plafond de temps réel par image, pour ne pas rattraper une longue pause d'onglet. */
  maxFrameMs?: number;
  brakeSide?: 'left' | 'right';
  /** Nœud de départ, pour les tests. */
  startNode?: string;
}

type Screen = 'room' | 'won' | 'lost' | 'branch' | 'reward' | 'end';

const TIME = {
  /** Pas sans contact avant chaque palier d'accélération. */
  accelAfterSteps: 120,
  accelScales: [1, 2, 3],
  skipScale: 8,
  slowMoScale: 0.25,
  slowMoMs: 400,
} as const;

export interface DebugState {
  screen: Screen;
  room: string;
  phase: string;
  turn: number;
  step: number;
  throws: number;
  hp: number;
  charge: number;
  form: string;
  enemies: number;
  hero: Vec2;
  inputs: number;
}

export class Game {
  readonly gesture = new AimGesture();
  run: RoomRun;
  node: CampaignNode;
  screen: Screen = 'room';
  throwCount = 0;
  private entryCarry: HeroCarry;
  private readonly disclosure: DisclosurePolicy;
  private readonly maxFrameMs: number;
  private readonly brakeSide: 'left' | 'right';
  private accumulatorMs = 0;
  private prediction: Prediction | null = null;
  private predictionKey = '';
  private marker: MarkerState = 'safe';
  private trail: Vec2[] | null = null;
  private trailStep = 0;
  private skipping = false;
  private slowMoRemainingMs = 0;
  private brakeFlashMs = 0;

  constructor(
    readonly campaign: Campaign,
    private readonly renderer: PixiRenderer,
    private readonly options: GameOptions = {},
  ) {
    this.disclosure = options.disclosure ?? DEFAULT_DISCLOSURE;
    this.maxFrameMs = options.maxFrameMs ?? 100;
    this.brakeSide = options.brakeSide ?? 'left';
    this.node = nodeOf(campaign, options.startNode ?? campaign.start);
    this.entryCarry = DEFAULT_CARRY;
    this.run = this.enterRoom(this.node, DEFAULT_CARRY);
  }

  /** Construit la salle d'un nœud avec l'état transporté du héros. */
  private enterRoom(node: CampaignNode, carry: HeroCarry): RoomRun {
    this.node = node;
    this.entryCarry = carry;
    const run = RoomRun.fromSpec(node.room, carry, this.options.sim ?? DEFAULT_SIM);
    this.run = run;
    this.screen = 'room';
    this.trail = null;
    this.prediction = null;
    this.predictionKey = '';
    this.skipping = false;
    this.slowMoRemainingMs = 0;
    this.renderer.setArena(node.room.width, node.room.height);
    this.renderer.drawOverlay(null);
    this.gesture.reset();
    return run;
  }

  /** Branche les événements de pointeur du canvas. */
  attachPointer(canvas: HTMLCanvasElement): void {
    const toInput = (type: PointerInput['type'], e: PointerEvent): PointerInput => {
      const rect = canvas.getBoundingClientRect();
      return { type, id: e.pointerId, x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const input = toInput('down', e);
      if (this.screen !== 'room') {
        const button = this.renderer.hitOverlayButton(input.x, input.y);
        if (button) this.onOverlayButton(button);
        return;
      }
      if (this.run.phase === 'moving') {
        if (this.renderer.hitBrake(input.x, input.y)) this.brake();
        else this.skip();
        return;
      }
      if (this.run.phase !== 'aim') return;
      canvas.setPointerCapture(e.pointerId);
      this.onGesture(this.gesture.handle(input));
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
    if (this.screen !== 'room') return false;
    const accepted = this.run.throwHero(dirX, dirY, power);
    if (accepted) {
      this.throwCount++;
      this.prediction = null;
      this.predictionKey = '';
      this.skipping = false;
      const t = this.run.heroPosition();
      this.trail = [{ x: t.x, y: t.y }];
      this.trailStep = this.run.sim.step;
    }
    return accepted;
  }

  brake(): boolean {
    const ok = this.run.brake();
    if (ok) this.brakeFlashMs = 250;
    return ok;
  }

  /** Tap pendant le mouvement : saute à l'immobilisation, sans changer le résultat. */
  skip(): void {
    if (this.run.phase === 'moving') this.skipping = true;
  }

  /** Avance la simulation du temps écoulé et redessine. */
  update(deltaMs: number): void {
    const frameMs = Math.min(deltaMs, this.maxFrameMs);
    const scale = this.timeScale();
    if (this.slowMoRemainingMs > 0) this.slowMoRemainingMs = Math.max(0, this.slowMoRemainingMs - frameMs);
    if (this.brakeFlashMs > 0) this.brakeFlashMs = Math.max(0, this.brakeFlashMs - frameMs);
    this.accumulatorMs += frameMs * scale;
    const stepMs = this.run.sim.config.dt * 1000;
    while (this.accumulatorMs >= stepMs) {
      this.accumulatorMs -= stepMs;
      if (this.screen === 'room' && this.run.phase === 'moving') {
        const events = this.run.tick();
        this.afterTick(events);
      }
    }
    if (this.run.phase !== 'moving') this.accumulatorMs = 0;
    this.render();
  }

  private timeScale(): number {
    if (this.screen !== 'room' || this.run.phase !== 'moving') return 1;
    if (this.slowMoRemainingMs > 0) return TIME.slowMoScale;
    if (this.skipping) return TIME.skipScale;
    const idle = this.run.sim.step - this.run.hero.lastContactStep;
    const level = Math.min(TIME.accelScales.length - 1, Math.floor(idle / TIME.accelAfterSteps));
    return TIME.accelScales[level]!;
  }

  private afterTick(events: RuleEvent[]): void {
    this.recordTrail(events.some((e) => e.type === 'bumper' || e.type === 'stick' || e.type === 'spring' || e.type === 'fall'));
    for (const event of events) {
      if ((event.type === 'death' || (event.type === 'fall' && event.kind !== 'hero')) && this.run.enemies().length === 0) {
        this.slowMoRemainingMs = TIME.slowMoMs;
        this.skipping = false;
      }
      if (event.type === 'won') this.showWon();
      if (event.type === 'lost') this.showLost();
    }
  }

  private recordTrail(contact: boolean): void {
    if (!this.trail) return;
    const t = this.run.heroPosition();
    const sampled = (this.run.sim.step - this.trailStep) % 4 === 0;
    if (contact || sampled || this.run.phase !== 'moving') this.trail.push({ x: t.x, y: t.y });
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
    if (!aim.armed || this.run.phase !== 'aim') {
      this.prediction = null;
      this.predictionKey = '';
      return;
    }
    const key = `${Math.round(aim.dirX * 200)}:${Math.round(aim.dirY * 200)}:${Math.round(aim.power * 100)}`;
    if (key === this.predictionKey) return;
    this.predictionKey = key;
    this.prediction = predictRoomThrow(this.run, aim.dirX, aim.dirY, aim.power);
    this.marker = this.markerFor(disclose(this.prediction, this.disclosure));
  }

  /** Couleur du marqueur d'arrêt face aux zones annoncées, telles qu'affichées. */
  private markerFor(preview: DisclosedPreview): MarkerState {
    const r = this.run.heroRadius();
    const zones = this.activeZones().flatMap((z) => z.zones);
    const inDanger = zones.some((zone) => circleIntersectsZone(preview.stop.x, preview.stop.y, r, zone));
    if (inDanger) return 'danger';
    if (preview.uncertain) return 'uncertain';
    const haloTouches = zones.some((zone) => circleIntersectsZone(preview.stop.x, preview.stop.y, r + preview.haloRadius, zone));
    return haloTouches ? 'uncertain' : 'safe';
  }

  private activeZones(): ZoneDrawing[] {
    const { world } = this.run.sim;
    return this.run.enemies().map((entity) => {
      const enemy = world.require(entity, Enemy);
      return { zones: enemy.intent?.zones ?? [], stunned: enemy.stunned };
    });
  }

  private showWon(): void {
    const next = this.node.next;
    const turns = this.run.state.turn;
    const lines = [`Terminée en ${turns} tour${turns > 1 ? 's' : ''}.`];
    if (this.node.room.reward === 'pierre' && this.run.carry().form !== 'pierre') {
      this.screen = 'reward';
      this.renderer.drawOverlay({
        title: 'Pouvoir trouvé : Pierre',
        lines: [...lines, 'Forme lourde : Dodu pousse plus fort et s\'arrête plus tôt.', 'Trois rebonds de mur chargent le Boulet de siège : masse triple, le premier obstacle cède.'],
        buttons: [{ id: 'equip', label: 'Équiper Pierre' }],
      });
      return;
    }
    if (next.length === 0) {
      this.screen = 'end';
      this.renderer.drawOverlay({
        title: 'Avant-poste libéré',
        lines: [...lines, 'Fin de la tranche verticale. Merci d\'avoir joué.'],
        buttons: [{ id: 'restart', label: 'Recommencer depuis le début' }],
      });
      return;
    }
    this.screen = 'won';
    this.renderer.drawOverlay({ title: 'Salle terminée', lines, buttons: [{ id: 'continue', label: 'Continuer' }] });
  }

  private showLost(): void {
    this.screen = 'lost';
    this.renderer.drawOverlay({
      title: 'Dodu est K.O.',
      lines: ['Les zones annoncées ne pardonnent pas. Recommencez la salle.'],
      buttons: [{ id: 'retry', label: 'Recommencer la salle' }],
    });
  }

  private showBranch(): void {
    this.screen = 'branch';
    const [a, b] = this.node.next;
    const nodeA = nodeOf(this.campaign, a!);
    const nodeB = nodeOf(this.campaign, b!);
    this.renderer.drawOverlay({
      title: 'Deux chemins',
      lines: ['Choisissez la prochaine salle.'],
      buttons: [
        { id: `go:${nodeA.id}`, label: nodeA.choiceLabel ?? nodeA.room.name },
        { id: `go:${nodeB.id}`, label: nodeB.choiceLabel ?? nodeB.room.name },
      ],
    });
  }

  private onOverlayButton(id: string): void {
    const carry = this.run.carry();
    if (id === 'equip') {
      this.proceed({ ...carry, form: 'pierre' });
      return;
    }
    if (id === 'continue') {
      this.proceed(carry);
      return;
    }
    if (id === 'retry') {
      this.enterRoom(this.node, this.entryCarry);
      return;
    }
    if (id === 'restart') {
      this.enterRoom(nodeOf(this.campaign, this.campaign.start), DEFAULT_CARRY);
      return;
    }
    if (id.startsWith('go:')) {
      this.enterRoom(nodeOf(this.campaign, id.slice(3)), carry);
    }
  }

  /** Après une victoire : embranchement, salle suivante ou fin. */
  private proceed(carry: HeroCarry): void {
    const next = this.node.next;
    if (next.length >= 2) {
      this.entryCarry = carry;
      this.showBranch();
      return;
    }
    const [only] = next;
    if (only === undefined) {
      this.enterRoom(nodeOf(this.campaign, this.campaign.start), DEFAULT_CARRY);
      return;
    }
    this.enterRoom(nodeOf(this.campaign, only), carry);
  }

  private objectiveLabel(): string {
    const objective = this.run.state.objective;
    if (objective.type === 'eliminate') return `Éliminer : ${this.run.enemies().length} restant${this.run.enemies().length > 1 ? 's' : ''}`;
    return 'Pousser l\'objet jusqu\'à la cible';
  }

  private render(): void {
    const { world } = this.run.sim;
    const hero = this.run.hero;
    this.renderer.drawStatics(world);
    const objective = this.run.state.objective;
    this.renderer.drawGoal(objective.type === 'push' ? objective.goal : null);
    this.renderer.drawZones(this.activeZones());
    this.renderer.drawTrail(this.trail);
    this.renderer.drawDynamics(world, this.run.heroEntity);
    const preview = this.prediction && this.gesture.active ? disclose(this.prediction, this.disclosure) : null;
    this.renderer.drawPreview(preview, this.run.heroRadius(), this.marker);
    this.renderer.drawHud({
      hp: hero.hp,
      maxHp: hero.maxHp,
      roomName: this.node.room.name,
      turn: this.run.state.turn,
      objective: this.objectiveLabel(),
      brakeAvailable: hero.brakeAvailable,
      brakeActive: this.brakeFlashMs > 0,
      charge: hero.charge,
      chargeMax: hero.chargeMax,
      form: hero.form,
      brakeSide: this.brakeSide,
    });
    this.renderer.drawAimIndicator(this.gesture.active ? this.gesture.aim : null);
  }

  /** Bouton d'écran de transition, pour les tests de bout en bout. */
  pressOverlay(id: string): void {
    if (this.screen !== 'room') this.onOverlayButton(id);
  }

  /** État lisible par les tests de bout en bout. */
  debugState(): DebugState {
    const hero = this.run.hero;
    return {
      screen: this.screen,
      room: this.node.room.id,
      phase: this.run.phase,
      turn: this.run.state.turn,
      step: this.run.sim.step,
      throws: this.throwCount,
      hp: hero.hp,
      charge: hero.charge,
      form: hero.form,
      enemies: this.run.enemies().length,
      hero: this.run.heroPosition(),
      inputs: this.run.sim.inputs.length,
    };
  }
}
