/**
 * Colle entre la campagne, la salle en cours, le geste, le rendu, le son, les
 * écrans et le stockage. Le temps réel est converti en pas fixes par un
 * accumulateur, modulé par l'échelle de temps (accélération automatique, tap
 * pour passer, ralenti court) et suspendu pendant les arrêts image et hors de
 * la salle. La simulation ne voit jamais de millisecondes.
 */
import type { AudioEngine } from '../audio/audio';
import { cueForHeavyImpact, cueForWallBounce, cuesForEvent } from '../audio/cues';
import type { Entity } from '../core/ecs/world';
import type { Vec2 } from '../core/math/vec2';
import type { ContactEvent } from '../core/physics';
import { nodeOf, type Campaign, type CampaignNode } from '../data/campaign';
import { AimGesture, type AimState, type GestureEvent, type PointerInput } from '../input/gesture';
import type { CreditDef, Expression } from '../render/assets';
import { disclose, DEFAULT_DISCLOSURE, type DisclosedPreview, type DisclosurePolicy } from '../render/disclosure';
import type { MarkerState, PixiRenderer, ZoneDrawing } from '../render/pixiRenderer';
import { Enemy, type RuleEvent } from '../sim/components';
import type { Prediction } from '../sim/lookahead';
import { DEFAULT_CARRY, type HeroCarry } from '../sim/room';
import { predictRoomThrow, RoomRun } from '../sim/rules/turn';
import { DEFAULT_SIM, type SimConfig } from '../sim/simulation';
import { circleIntersectsZone } from '../sim/zones';
import { enemyExpression, heroExpression } from './expressions';
import { nextVolume, type GameSettings } from './options';
import { contractGoal, contractLabel, rewardLabel } from '../sim/contracts';
import { creditsScreen, elementScreen, endingScreen, formChoiceScreen, mapScreen, optionsScreen, pauseScreen, titleScreen } from './screens';
import { formName } from '../sim/rules/powers';
import type { HeroForm } from '../sim/components';
import { emptyStats, GameStorage, type RunStats, type SaveGame } from './storage';

export interface GameOptions {
  sim?: SimConfig;
  /** Plafond de temps réel par image, pour ne pas rattraper une longue pause d'onglet. */
  maxFrameMs?: number;
  /** Nœud de départ : saute l'accueil et entre directement dans la salle, pour les tests. */
  startNode?: string;
  audio?: AudioEngine;
  storage?: GameStorage;
  credits?: readonly CreditDef[];
  /** Affiche l'état audio et la version à l'écran, pour diagnostiquer à distance. */
  diagnostics?: boolean;
  version?: string;
}

export type Screen = 'title' | 'options' | 'credits' | 'room' | 'pause' | 'map' | 'won' | 'lost' | 'reward' | 'end';

const TIME = {
  accelAfterSteps: 120,
  accelScales: [1, 2, 3],
  skipScale: 8,
  slowMoScale: 0.25,
  slowMoMs: 400,
  hitStopMs: 40,
  bigHitStopMs: 70,
} as const;

/** Piste musicale par salle : le boss a la sienne, les salles risquées l'exploration héroïque. */
function musicFor(node: CampaignNode): string {
  if (node.room.enemies.some((e) => e.archetype === 'boss')) return 'boss';
  if (node.room.reward) return 'wilds';
  return 'explore';
}

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
  expression: string;
  hasSave: boolean;
  testMode: boolean;
}

export class Game {
  readonly gesture = new AimGesture();
  run: RoomRun;
  node: CampaignNode;
  screen: Screen = 'room';
  throwCount = 0;
  settings: GameSettings;
  private readonly storage: GameStorage;
  private readonly credits: readonly CreditDef[];
  private runActive = false;
  private path: string[] = [];
  private stats: RunStats = emptyStats();
  private entryCarry: HeroCarry;
  private disclosure: DisclosurePolicy = DEFAULT_DISCLOSURE;
  private readonly maxFrameMs: number;
  private readonly audio: AudioEngine | null;
  private optionsFrom: 'title' | 'pause' = 'title';
  private creditsPage = 0;
  private testNodeIndex = 0;
  private accumulatorMs = 0;
  private prediction: Prediction | null = null;
  private predictionKey = '';
  private marker: MarkerState = 'safe';
  private trail: Vec2[] | null = null;
  private trailStep = 0;
  private skipping = false;
  private slowMoRemainingMs = 0;
  private hitStopMs = 0;
  private brakeFlashMs = 0;
  private comboIndex = 0;
  private sinceHeroImpact = Infinity;
  private sinceHeroHit = Infinity;
  private readonly sinceEnemyDamage = new Map<Entity, number>();
  private readonly expressions = new Map<Entity, Expression>();
  private heroExpressionNow: Expression = 'neutral';

  constructor(
    readonly campaign: Campaign,
    private readonly renderer: PixiRenderer,
    private readonly options: GameOptions = {},
  ) {
    this.maxFrameMs = options.maxFrameMs ?? 100;
    this.audio = options.audio ?? null;
    this.storage = options.storage ?? new GameStorage(null);
    this.credits = options.credits ?? [];
    this.settings = this.storage.loadSettings();
    this.entryCarry = DEFAULT_CARRY;
    this.applySettings();
    if (options.startNode) {
      this.node = nodeOf(campaign, options.startNode);
      this.run = this.startRun(this.node.id, DEFAULT_CARRY, [], emptyStats());
    } else {
      this.node = nodeOf(campaign, campaign.start);
      this.run = this.enterRoom(this.node, DEFAULT_CARRY);
      this.showTitle();
    }
  }

  private get nodeIds(): string[] {
    return Object.keys(this.campaign.nodes);
  }

  /** Applique les options au son, au frein et à l'aide à la visée. */
  private applySettings(): void {
    const s = this.settings;
    this.audio?.setVolumes(s.volumes);
    this.disclosure = { ...DEFAULT_DISCLOSURE, showFullPath: s.test.enabled && s.test.fullPath };
    if (this.run) this.run.state.invincible = s.test.enabled && s.test.invincible;
    this.storage.saveSettings(s);
  }

  /** Construit la salle d'un nœud avec l'état transporté du héros. */
  private enterRoom(node: CampaignNode, carry: HeroCarry): RoomRun {
    this.node = node;
    this.entryCarry = carry;
    const run = RoomRun.fromSpec(node.room, carry, this.options.sim ?? DEFAULT_SIM);
    run.state.invincible = this.settings.test.enabled && this.settings.test.invincible;
    this.run = run;
    this.screen = 'room';
    this.trail = null;
    this.prediction = null;
    this.predictionKey = '';
    this.skipping = false;
    this.slowMoRemainingMs = 0;
    this.hitStopMs = 0;
    this.sinceHeroImpact = Infinity;
    this.sinceHeroHit = Infinity;
    this.sinceEnemyDamage.clear();
    this.renderer.setArena(node.room.width, node.room.height);
    this.renderer.drawOverlay(null);
    this.gesture.reset();
    this.audio?.playMusic(musicFor(node));
    if (this.runActive) this.persist();
    return run;
  }

  /** Démarre ou reprend un run à un nœud donné, puis sauvegarde. */
  private startRun(nodeId: string, carry: HeroCarry, path: string[], stats: RunStats): RoomRun {
    this.runActive = true;
    this.path = path;
    this.stats = stats;
    return this.enterRoom(nodeOf(this.campaign, nodeId), carry);
  }

  private persist(): void {
    const save: SaveGame = {
      version: 1,
      nodeId: this.node.id,
      carry: this.entryCarry,
      path: [...this.path],
      stats: { turns: { ...this.stats.turns }, damageTaken: this.stats.damageTaken, roomsCleared: this.stats.roomsCleared },
      savedAt: Date.now(),
    };
    this.storage.saveGame(save);
  }

  private hasSave(): boolean {
    return this.storage.loadSave(this.nodeIds) !== null;
  }

  // Écrans -------------------------------------------------------------------

  private showTitle(): void {
    this.screen = 'title';
    this.runActive = false;
    this.renderer.drawOverlay(titleScreen(this.hasSave(), this.options.version ?? '0'));
  }

  private showOptions(from: 'title' | 'pause'): void {
    this.optionsFrom = from;
    this.screen = 'options';
    const names = this.nodeIds.map((id) => this.campaign.nodes[id]!.room.name);
    this.renderer.drawOverlay(optionsScreen(this.settings, names, this.testNodeIndex, from));
  }

  private showCredits(): void {
    this.screen = 'credits';
    this.renderer.drawOverlay(creditsScreen(this.credits, this.creditsPage));
  }

  private showPause(): void {
    this.screen = 'pause';
    this.gesture.reset();
    this.prediction = null;
    this.renderer.drawOverlay(pauseScreen(this.node.room.name));
  }

  private showMap(readOnly: boolean): void {
    this.screen = 'map';
    this.renderer.drawOverlay(mapScreen(this.campaign, this.node.id, this.path, this.node.next, readOnly));
  }

  private showWon(): void {
    this.stats.turns[this.node.id] = this.run.state.turn;
    this.stats.roomsCleared++;
    const turns = this.run.state.turn;
    const lines = [`Terminée en ${turns} tour${turns > 1 ? 's' : ''}.`];
    const state = this.run.state;
    if (state.contract) {
      lines.push(
        state.contractDone
          ? `Contrat rempli, ${contractGoal(state.contract)} : ${rewardLabel(state.contract.reward)}.`
          : `Contrat manqué : ${contractGoal(state.contract)}.`,
      );
    }
    const carry = this.run.carry();
    if (this.node.room.reward === 'forme') {
      this.screen = 'reward';
      this.renderer.drawOverlay(formChoiceScreen(turns, carry.element));
      return;
    }
    if (this.node.room.reward === 'element' && carry.element === 'none') {
      this.screen = 'reward';
      this.renderer.drawOverlay(elementScreen(turns, carry.form));
      return;
    }
    if (this.node.next.length === 0) {
      this.screen = 'end';
      this.storage.clearSave();
      this.runActive = false;
      this.renderer.drawOverlay(endingScreen(this.stats));
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

  /** Bouton d'écran. Les identifiants sont le contrat des constructeurs d'écrans. */
  private onOverlayButton(id: string): void {
    const carry = this.run.carry();
    switch (id) {
      case 'new-run': {
        this.storage.clearSave();
        const start = this.settings.test.enabled ? (this.nodeIds[this.testNodeIndex] ?? this.campaign.start) : this.campaign.start;
        this.startRun(start, DEFAULT_CARRY, [], emptyStats());
        return;
      }
      case 'continue-run': {
        const save = this.storage.loadSave(this.nodeIds);
        if (save) this.startRun(save.nodeId, save.carry, save.path, save.stats);
        else this.showTitle();
        return;
      }
      case 'options':
        this.showOptions('title');
        return;
      case 'options-pause':
        this.showOptions('pause');
        return;
      case 'credits':
        this.creditsPage = 0;
        this.showCredits();
        return;
      case 'credits-next':
        this.creditsPage++;
        this.showCredits();
        return;
      case 'back-title':
        this.showTitle();
        return;
      case 'back-pause':
        this.showPause();
        return;
      case 'map-pause':
        this.showMap(true);
        return;
      case 'resume':
        this.screen = 'room';
        this.renderer.drawOverlay(null);
        return;
      case 'quit':
        this.showTitle();
        return;
      case 'equip-element':
        this.proceed({ ...carry, element: 'electricite' });
        return;
      case 'continue':
        this.proceed(carry);
        return;
      case 'retry':
        this.enterRoom(this.node, this.entryCarry);
        return;
      case 'restart':
        this.storage.clearSave();
        this.startRun(this.campaign.start, DEFAULT_CARRY, [], emptyStats());
        return;
      default:
        break;
    }
    if (id.startsWith('form:')) {
      this.proceed({ ...carry, form: id.slice(5) as HeroForm });
      return;
    }
    if (id.startsWith('go:')) {
      this.path.push(this.node.id);
      this.enterRoom(nodeOf(this.campaign, id.slice(3)), this.entryCarry);
      return;
    }
    if (id.startsWith('opt-')) this.changeOption(id);
  }

  private changeOption(id: string): void {
    const s = this.settings;
    switch (id) {
      case 'opt-master':
        s.volumes.master = nextVolume(s.volumes.master);
        break;
      case 'opt-sfx':
        s.volumes.sfx = nextVolume(s.volumes.sfx);
        this.audio?.play({ key: 'uiTap', volume: 1, semitones: 0 });
        break;
      case 'opt-music':
        s.volumes.music = nextVolume(s.volumes.music);
        break;
      case 'opt-brake':
        s.brakeSide = s.brakeSide === 'left' ? 'right' : 'left';
        break;
      case 'opt-test':
        s.test.enabled = !s.test.enabled;
        break;
      case 'opt-invincible':
        s.test.invincible = !s.test.invincible;
        break;
      case 'opt-fullpath':
        s.test.fullPath = !s.test.fullPath;
        break;
      case 'opt-node':
        this.testNodeIndex = (this.testNodeIndex + 1) % this.nodeIds.length;
        break;
      default:
        return;
    }
    this.applySettings();
    this.showOptions(this.optionsFrom);
  }

  /** Après une victoire : embranchement, salle suivante ou fin. */
  private proceed(carry: HeroCarry): void {
    const next = this.node.next;
    this.entryCarry = carry;
    if (next.length >= 2) {
      this.showMap(false);
      return;
    }
    const [only] = next;
    if (only === undefined) {
      this.storage.clearSave();
      this.startRun(this.campaign.start, DEFAULT_CARRY, [], emptyStats());
      return;
    }
    this.path.push(this.node.id);
    this.enterRoom(nodeOf(this.campaign, only), carry);
  }

  // Entrées ------------------------------------------------------------------

  attachPointer(canvas: HTMLCanvasElement): void {
    const toInput = (type: PointerInput['type'], e: PointerEvent): PointerInput => {
      const rect = canvas.getBoundingClientRect();
      return { type, id: e.pointerId, x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.audio?.unlock();
      const input = toInput('down', e);
      if (this.screen !== 'room') {
        const button = this.renderer.hitOverlayButton(input.x, input.y);
        if (button) {
          this.audio?.play({ key: 'uiTap', volume: 0.8, semitones: 0 });
          this.onOverlayButton(button);
        }
        return;
      }
      if (this.renderer.hitPause(input.x, input.y)) {
        this.showPause();
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
      this.audio?.unlock();
      this.onGesture(this.gesture.handle(toInput('up', e)));
    });
    canvas.addEventListener('touchend', () => this.audio?.unlock(), { passive: true });
    canvas.addEventListener('click', () => this.audio?.unlock());
    canvas.addEventListener('pointercancel', (e) => {
      this.onGesture(this.gesture.handle(toInput('cancel', e)));
    });
  }

  throwFromAim(dirX: number, dirY: number, power: number): boolean {
    if (this.screen !== 'room') return false;
    const strong = (this.run.hero.form !== 'none' || this.run.hero.element !== 'none') && this.run.hero.charge >= this.run.hero.chargeMax;
    const accepted = this.run.throwHero(dirX, dirY, power);
    if (accepted) {
      this.throwCount++;
      this.prediction = null;
      this.predictionKey = '';
      this.skipping = false;
      this.comboIndex = 0;
      const t = this.run.heroPosition();
      this.trail = [{ x: t.x, y: t.y }];
      this.trailStep = this.run.sim.step;
      this.audio?.play({ key: strong ? 'strongThrow' : 'throw', volume: 0.5 + power * 0.5, semitones: 0 });
    }
    return accepted;
  }

  brake(): boolean {
    const ok = this.run.brake();
    if (ok) {
      this.brakeFlashMs = 250;
      this.audio?.play({ key: 'stick', volume: 0.6, semitones: -4 });
    }
    return ok;
  }

  skip(): void {
    if (this.run.phase === 'moving') this.skipping = true;
  }

  // Boucle -------------------------------------------------------------------

  update(deltaMs: number): void {
    const frameMs = Math.min(deltaMs, this.maxFrameMs);
    const dt = frameMs / 1000;
    if (this.slowMoRemainingMs > 0) this.slowMoRemainingMs = Math.max(0, this.slowMoRemainingMs - frameMs);
    if (this.brakeFlashMs > 0) this.brakeFlashMs = Math.max(0, this.brakeFlashMs - frameMs);
    this.sinceHeroImpact += dt;
    this.sinceHeroHit += dt;
    for (const [entity, since] of this.sinceEnemyDamage) this.sinceEnemyDamage.set(entity, since + dt);

    if (this.hitStopMs > 0) {
      this.hitStopMs = Math.max(0, this.hitStopMs - frameMs);
    } else if (this.screen === 'room') {
      this.accumulatorMs += frameMs * this.timeScale();
      const stepMs = this.run.sim.config.dt * 1000;
      while (this.accumulatorMs >= stepMs && this.hitStopMs === 0) {
        this.accumulatorMs -= stepMs;
        if (this.screen === 'room' && this.run.phase === 'moving') {
          const events = this.run.tick();
          this.afterTick(events, this.run.lastContacts);
        }
      }
    }
    if (this.run.phase !== 'moving' || this.screen !== 'room') this.accumulatorMs = 0;
    this.render(dt);
  }

  private timeScale(): number {
    if (this.screen !== 'room' || this.run.phase !== 'moving') return 1;
    if (this.slowMoRemainingMs > 0) return TIME.slowMoScale;
    if (this.skipping) return TIME.skipScale;
    const idle = this.run.sim.step - this.run.hero.lastContactStep;
    const level = Math.min(TIME.accelScales.length - 1, Math.floor(idle / TIME.accelAfterSteps));
    return TIME.accelScales[level]!;
  }

  private afterTick(events: RuleEvent[], contacts: ContactEvent[]): void {
    const hero = this.run.heroEntity;
    let heroContact = false;
    for (const c of contacts) {
      if (c.a === hero || c.b === hero) heroContact = true;
      this.feedbackForContact(c, hero);
    }
    this.recordTrail(heroContact || events.some((e) => e.type === 'spring' || e.type === 'fall'));
    for (const event of events) this.feedbackForEvent(event);
  }

  private feedbackForContact(c: ContactEvent, hero: Entity): void {
    const strength = Math.min(1, c.impactSpeed / 12);
    if (c.impactSpeed < 1) return;
    if (c.b === null) {
      this.renderer.punch(c.a, c.nx, c.ny, strength);
      if (c.a === hero) {
        this.sinceHeroImpact = 0;
        const cue = cueForWallBounce(c.impactSpeed);
        if (cue) this.audio?.play(cue);
        this.renderer.burst('spark', c.x, c.y, 3 + Math.round(strength * 5), Math.atan2(c.ny, c.nx));
      } else {
        const cue = cueForHeavyImpact(c.impactSpeed);
        if (cue) this.audio?.play(cue);
        if (c.impactSpeed >= 3) this.renderer.burst('dust', c.x, c.y, 3);
      }
      return;
    }
    this.renderer.punch(c.a, -c.nx, -c.ny, strength);
    this.renderer.punch(c.b, c.nx, c.ny, strength);
    if (c.a === hero || c.b === hero) {
      this.sinceHeroImpact = 0;
      this.renderer.burst('glow', c.x, c.y, 2);
    }
  }

  private feedbackForEvent(event: RuleEvent): void {
    switch (event.type) {
      case 'damage':
        this.sinceEnemyDamage.set(event.entity, 0);
        for (const cue of cuesForEvent(event, this.comboIndex)) this.audio?.play(cue);
        this.comboIndex++;
        return;
      case 'death':
        this.hitStopMs = Math.max(this.hitStopMs, TIME.hitStopMs);
        this.renderer.burst('dust', event.x, event.y, 10);
        if (this.run.enemies().length === 0) {
          this.slowMoRemainingMs = TIME.slowMoMs;
          this.skipping = false;
        }
        break;
      case 'break':
        this.hitStopMs = Math.max(this.hitStopMs, event.breakableKind === 'crate' ? TIME.hitStopMs : TIME.bigHitStopMs);
        this.renderer.burst(event.breakableKind === 'crate' || event.breakableKind === 'barricade' ? 'wood' : 'stone', event.x, event.y, 10);
        break;
      case 'crack':
        this.renderer.burst('dust', event.x, event.y, 4);
        break;
      case 'shield':
        this.renderer.burst('spark', event.x, event.y, 6);
        break;
      case 'enemyHeal':
        this.renderer.burst('glow', event.x, event.y, 4);
        break;
      case 'place':
        this.renderer.burst('dust', event.x, event.y, 6);
        break;
      case 'contract': {
        if (!event.done) break;
        const h = this.run.heroPosition();
        this.renderer.burst('glow', h.x, h.y, 10);
        break;
      }
      case 'explosion':
        this.hitStopMs = Math.max(this.hitStopMs, TIME.bigHitStopMs);
        this.renderer.burst('glow', event.x, event.y, 8);
        this.renderer.burst('spark', event.x, event.y, 16);
        this.renderer.burst('dust', event.x, event.y, 12);
        break;
      case 'fall':
        this.renderer.burst('dust', event.x, event.y, 6);
        if (event.kind === 'hero') {
          this.sinceHeroHit = 0;
          this.stats.damageTaken++;
        } else if (this.run.enemies().length === 0) {
          this.slowMoRemainingMs = TIME.slowMoMs;
          this.skipping = false;
        }
        break;
      case 'heroHit':
        this.sinceHeroHit = 0;
        this.stats.damageTaken++;
        this.hitStopMs = Math.max(this.hitStopMs, TIME.hitStopMs);
        break;
      case 'spring':
        this.renderer.burst('glow', event.x, event.y, 4);
        break;
      case 'bumper':
        this.renderer.burst('spark', event.x, event.y, 6);
        break;
      case 'arc':
        this.renderer.arc(event.fromX, event.fromY, event.toX, event.toY);
        this.renderer.burst('spark', event.toX, event.toY, 4);
        break;
      case 'anchor':
        this.renderer.burst('glow', event.x, event.y, 3);
        break;
      case 'won':
        this.showWon();
        break;
      case 'lost':
        this.showLost();
        break;
      default:
        break;
    }
    for (const cue of cuesForEvent(event, this.comboIndex)) this.audio?.play(cue);
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

  private markerFor(preview: DisclosedPreview): MarkerState {
    const r = this.run.heroRadius();
    const zones = this.activeZones().filter((z) => !z.harmless).flatMap((z) => z.zones);
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
      return { zones: enemy.intent?.zones ?? [], stunned: enemy.stunned, harmless: enemy.intent?.harmless ?? false };
    });
  }

  private contractLine(): string | null {
    const state = this.run.state;
    return state.contract ? contractLabel(state.contract, state) : null;
  }

  private objectiveLabel(): string {
    const objective = this.run.state.objective;
    const count = this.run.enemies().length;
    if (objective.type === 'eliminate') return `Éliminer : ${count} restant${count > 1 ? 's' : ''}`;
    return 'Pousser l\'œuf jusqu\'au nid';
  }

  private computeExpressions(): void {
    const { world } = this.run.sim;
    this.expressions.clear();
    this.heroExpressionNow = heroExpression({
      phase: this.run.phase,
      aiming: this.gesture.active && this.gesture.aim.armed,
      marker: this.marker,
      sinceImpact: this.sinceHeroImpact,
      sinceHit: this.sinceHeroHit,
    });
    this.expressions.set(this.run.heroEntity, this.heroExpressionNow);
    for (const entity of this.run.enemies()) {
      const enemy = world.require(entity, Enemy);
      this.expressions.set(entity, enemyExpression(enemy.stunned, this.sinceEnemyDamage.get(entity) ?? Infinity));
    }
  }

  private render(dt: number): void {
    const { world } = this.run.sim;
    const hero = this.run.hero;
    this.computeExpressions();
    this.renderer.beginFrame(dt);
    this.renderer.drawStatics(world);
    const objective = this.run.state.objective;
    this.renderer.drawGoal(objective.type === 'push' ? objective.goal : null);
    this.renderer.drawZones(this.activeZones());
    this.renderer.drawTrail(this.trail);
    this.renderer.drawDynamics(world, this.run.heroEntity, this.expressions, dt);
    this.renderer.setHeroTint(this.run.heroEntity, hero.form);
    const preview = this.prediction && this.gesture.active ? disclose(this.prediction, this.disclosure) : null;
    this.renderer.drawPreview(preview, this.run.heroRadius(), this.marker);
    this.renderer.drawHud({
      hp: hero.hp,
      maxHp: hero.maxHp,
      roomName: this.node.room.name,
      turn: this.run.state.turn,
      objective: this.objectiveLabel(),
      contract: this.contractLine(),
      brakeAvailable: hero.brakeAvailable,
      brakeActive: this.brakeFlashMs > 0,
      charge: hero.charge,
      chargeMax: hero.chargeMax,
      form: hero.form === 'none' && hero.element === 'none' ? 'none' : `${formName(hero.form)}${hero.element === 'electricite' ? ' ⚡' : ''}`,
      heroForm: hero.form,
      brakeSide: this.settings.brakeSide,
      diagnostics: this.options.diagnostics ? this.diagnosticsLine() : null,
    });
    this.renderer.drawAimIndicator(this.gesture.active ? this.gesture.aim : null);
  }

  private diagnosticsLine(): string {
    const a = this.audio?.state();
    if (!a) return `v${this.options.version ?? '?'} · audio absent`;
    return [
      `v${this.options.version ?? '?'}`,
      `ctx ${a.contextState}`,
      `sons ${a.decoded}/${a.decoded + a.pending}`,
      `joués ${a.played}`,
      `musique ${a.musicTrack ?? 'aucune'} ${a.musicPlaying ? 'en lecture' : 'arrêtée'}`,
      a.lastError ? `erreur ${a.lastError}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  pressOverlay(id: string): void {
    if (this.screen !== 'room') this.onOverlayButton(id);
  }

  /** Ouvre la pause depuis l'extérieur, pour les tests. */
  pause(): void {
    if (this.screen === 'room') this.showPause();
  }

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
      expression: this.heroExpressionNow,
      hasSave: this.hasSave(),
      testMode: this.settings.test.enabled,
    };
  }
}
