/**
 * Colle entre le run roguelite, la salle en cours, le geste, le rendu, le son,
 * les écrans et le stockage. Le temps réel est converti en pas fixes par un
 * accumulateur, modulé par l'échelle de temps (accélération automatique, tap
 * pour passer, ralenti court) et suspendu pendant les arrêts image et hors de
 * la salle. La simulation ne voit jamais de millisecondes.
 */
import type { AudioEngine } from '../audio/audio';
import { cueForHeavyImpact, cueForWallBounce, cuesForEvent } from '../audio/cues';
import type { Entity } from '../core/ecs/world';
import type { Vec2 } from '../core/math/vec2';
import { Transform, type ContactEvent } from '../core/physics';
import { roomsForTier, type PoolEntry } from '../data/pool';
import { AimGesture, type AimState, type GestureEvent, type PointerInput } from '../input/gesture';
import type { CreditDef, Expression } from '../render/assets';
import { disclose, DEFAULT_DISCLOSURE, type DisclosedPreview, type DisclosurePolicy } from '../render/disclosure';
import type { MapSpec } from '../render/mapView';
import type { MarkerState, PixiRenderer, ZoneDrawing } from '../render/pixiRenderer';
import { charmById, showsFullPath, type CharmId } from '../run/charms';
import { drawEvent, type EventDef } from '../run/events';
import { buyCharm, buyHeal, makeShop, reroll, type ShopOffer } from '../run/shop';
import {
  canRevive, chooseCharm, chooseElement, chooseForm, completeCombat, currentNode, die, leaveNode, modsFor, moveTo, newRun, offerCharms,
  pickRoom, reachable, rest as restChoice, summary, takeCharm, tierFor, useRevive, withRng, type RunState,
} from '../run/state';
import { Enemy, type HeroForm, type RuleEvent } from '../sim/components';
import { contractGoal, contractLabel, rewardLabel } from '../sim/contracts';
import type { Prediction } from '../sim/lookahead';
import { DEFAULT_MODIFIERS, type RunModifiers } from '../sim/modifiers';
import { DEFAULT_CARRY, type HeroCarry } from '../sim/room';
import { formName } from '../sim/rules/powers';
import { predictRoomThrow, RoomRun } from '../sim/rules/turn';
import { DEFAULT_SIM, type SimConfig } from '../sim/simulation';
import { circleIntersectsZone } from '../sim/zones';
import { enemyExpression, heroExpression } from './expressions';
import { nextVolume, type GameSettings } from './options';
import {
  actName, charmRewardScreen, charmsScreen, combatWonScreen, eventOutcomeScreen, eventScreen, restScreen, runDeadScreen, runWonScreen, shopScreen, treasureScreen,
} from './runScreens';
import { creditsScreen, elementScreen, formChoiceScreen, optionsScreen, pauseScreen, titleScreen } from './screens';
import { GameStorage } from './storage';

export interface GameOptions {
  sim?: SimConfig;
  /** Plafond de temps réel par image, pour ne pas rattraper une longue pause d'onglet. */
  maxFrameMs?: number;
  /** Salle de départ du vivier : saute l'accueil et entre directement en combat, pour les tests. */
  startRoom?: string;
  audio?: AudioEngine;
  storage?: GameStorage;
  credits?: readonly CreditDef[];
  /** Affiche l'état audio et la version à l'écran, pour diagnostiquer à distance. */
  diagnostics?: boolean;
  version?: string;
}

export type Screen =
  | 'title' | 'options' | 'credits' | 'room' | 'pause' | 'map' | 'won' | 'lost' | 'reward'
  | 'shop' | 'event' | 'rest' | 'treasure' | 'charms' | 'end';

const TIME = {
  /** Pas sans contact avant chaque palier d'accélération : une demi-seconde. */
  accelAfterSteps: 60,
  accelScales: [1, 2, 3],
  skipScale: 8,
  slowMoScale: 0.25,
  slowMoMs: 400,
  hitStopMs: 40,
  bigHitStopMs: 70,
} as const;

/** Piste musicale : le boss a la sienne, les élites et le dernier acte l'exploration héroïque. */
function musicFor(entry: PoolEntry, elite: boolean): string {
  if (entry.kind === 'boss') return 'boss';
  if (elite || entry.tier === 3) return 'wilds';
  return 'explore';
}

/** Événements de résolution du tour, présentés en séquence plutôt qu'à l'instant. */
function isTurnEvent(event: RuleEvent): boolean {
  switch (event.type) {
    case 'stun':
    case 'contract':
    case 'won':
    case 'heroHit':
    case 'blocked':
    case 'lost':
    case 'enemyHeal':
    case 'place':
    case 'replay':
    case 'move':
    case 'turn':
    case 'revive':
      return true;
    default:
      return false;
  }
}

/** Graine d'un nouveau run : l'horloge et le hasard du navigateur, hors simulation. */
function freshSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
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
  act: number;
  nodeType: string | null;
  plumes: number;
  charms: string[];
  /** Nœuds de carte atteignables, pour piloter la carte depuis les tests. */
  reachable: string[];
  /** Vrai pendant la présentation de la fin de tour, où la visée attend. */
  busy: boolean;
}

export class Game {
  readonly gesture = new AimGesture();
  run: RoomRun;
  entry: PoolEntry;
  screen: Screen = 'room';
  throwCount = 0;
  settings: GameSettings;
  runState: RunState | null = null;
  private readonly storage: GameStorage;
  private readonly credits: readonly CreditDef[];
  private roomElite = false;
  private shop: ShopOffer | null = null;
  private event: EventDef | null = null;
  private treasure: CharmId[] = [];
  private disclosure: DisclosurePolicy = DEFAULT_DISCLOSURE;
  private readonly maxFrameMs: number;
  private readonly audio: AudioEngine | null;
  private optionsFrom: 'title' | 'pause' = 'title';
  private creditsPage = 0;
  private testRoomIndex = 0;
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
  /** Présentation différée de la fin de tour : charges, coups, sauts, annonces. */
  private cinematic: Array<{ at: number; run: () => void }> = [];
  private cinematicMs = 0;
  private pendingHits = 0;
  private sinceHeroHit = Infinity;
  private readonly sinceEnemyDamage = new Map<Entity, number>();
  private readonly expressions = new Map<Entity, Expression>();
  private heroExpressionNow: Expression = 'neutral';

  constructor(
    readonly pool: readonly PoolEntry[],
    private readonly renderer: PixiRenderer,
    private readonly options: GameOptions = {},
  ) {
    this.maxFrameMs = options.maxFrameMs ?? 100;
    this.audio = options.audio ?? null;
    this.storage = options.storage ?? new GameStorage(null);
    this.credits = options.credits ?? [];
    this.settings = this.storage.loadSettings();
    const first = this.baseEntries()[0];
    if (!first) throw new Error('Le vivier de salles est vide');
    this.entry = first;
    this.run = this.enterRoom(first, DEFAULT_CARRY, DEFAULT_MODIFIERS, false);
    this.applySettings();
    const start = options.startRoom ? pool.find((e) => e.id === options.startRoom) : undefined;
    if (start) this.startRun(start);
    else this.showTitle();
  }

  /** Salles dessinées à la main, sans variante : la liste du mode test. */
  private baseEntries(): PoolEntry[] {
    return this.pool.filter((e) => e.variant === 'base');
  }

  /** Applique les options au son, au frein et à l'aide à la visée. */
  private applySettings(): void {
    const s = this.settings;
    this.audio?.setVolumes(s.volumes);
    const fullPath = (s.test.enabled && s.test.fullPath) || (this.runState !== null && showsFullPath(this.runState.charms));
    this.disclosure = { ...DEFAULT_DISCLOSURE, showFullPath: fullPath };
    this.run.state.invincible = s.test.enabled && s.test.invincible;
    this.storage.saveSettings(s);
  }

  /** Construit la salle d'une entrée du vivier avec l'état transporté du héros et les règles du run. */
  private enterRoom(entry: PoolEntry, carry: HeroCarry, mods: RunModifiers, elite: boolean): RoomRun {
    this.entry = entry;
    this.roomElite = elite;
    const run = RoomRun.fromSpec(entry.spec, carry, this.options.sim ?? DEFAULT_SIM, mods);
    run.state.invincible = this.settings.test.enabled && this.settings.test.invincible;
    this.run = run;
    this.screen = 'room';
    this.trail = null;
    this.prediction = null;
    this.predictionKey = '';
    this.skipping = false;
    this.slowMoRemainingMs = 0;
    this.hitStopMs = 0;
    this.comboIndex = 0;
    this.sinceHeroImpact = Infinity;
    this.sinceHeroHit = Infinity;
    this.sinceEnemyDamage.clear();
    this.cinematic = [];
    this.pendingHits = 0;
    this.renderer.setArena(entry.spec.width, entry.spec.height, this.runState?.act ?? 1);
    this.renderer.fadeIn();
    this.renderer.drawMap(null);
    this.renderer.drawOverlay(null);
    this.gesture.reset();
    this.audio?.playMusic(musicFor(entry, elite));
    return run;
  }

  // Run ------------------------------------------------------------------------

  /** Nouveau run ; avec une salle forcée, entre directement en combat sur elle. */
  private startRun(forced: PoolEntry | null): void {
    this.storage.clearSave();
    this.runState = newRun(freshSeed());
    this.applySettings();
    if (forced) {
      const first = reachable(this.runState)[0];
      if (first) moveTo(this.runState, first.id);
      this.startCombat(forced, false);
      return;
    }
    this.persist();
    this.showRunMap(false);
  }

  private resumeRun(state: RunState): void {
    this.runState = state;
    this.applySettings();
    const node = currentNode(state);
    if (state.phase === 'node' && node && state.roomId) {
      const entry = this.pool.find((e) => e.id === state.roomId);
      if (entry) {
        this.startCombat(entry, state.roomElite, false);
        return;
      }
    }
    if (state.phase === 'node') leaveNode(state);
    this.showRunMap(false);
  }

  private persist(): void {
    if (!this.runState || this.runState.phase === 'dead' || this.runState.phase === 'won') return;
    this.storage.saveGame({ version: 2, run: this.runState, savedAt: Date.now() });
  }

  private hasSave(): boolean {
    return this.storage.loadSave() !== null;
  }

  private mapSpec(readOnly: boolean): MapSpec {
    const rs = this.runState;
    if (!rs) throw new Error('Aucun run en cours');
    return {
      map: rs.map,
      current: rs.nodeId,
      visited: rs.visited,
      reachable: readOnly ? [] : reachable(rs).map((n) => n.id),
      actName: `Acte ${rs.act} : ${actName(rs.act)}`,
      hp: rs.hp,
      maxHp: rs.maxHp,
      plumes: rs.plumes,
      charms: rs.charms.map((id) => charmById(id).name),
      readOnly,
    };
  }

  private showRunMap(readOnly: boolean): void {
    this.screen = 'map';
    this.gesture.reset();
    this.prediction = null;
    this.renderer.drawOverlay(null);
    this.renderer.drawMap(this.mapSpec(readOnly));
  }

  /** Entre dans un nœud atteignable de la carte et le joue selon son type. */
  private enterNode(id: string): void {
    const rs = this.runState;
    if (!rs || !reachable(rs).some((n) => n.id === id)) return;
    const node = moveTo(rs, id);
    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss': {
        const tier = tierFor(rs.act);
        const kind = node.type === 'boss' ? 'boss' : 'combat';
        let candidates = roomsForTier(tier, kind);
        let elite = node.type === 'elite' || rs.nextCombatElite;
        if (candidates.length === 0 && kind === 'boss') {
          // Pas encore de gardien propre au dernier acte : celui des Terrasses, en élite.
          candidates = roomsForTier(2, 'boss');
          elite = true;
        }
        const entry = pickRoom(rs, candidates);
        this.startCombat(entry, elite, true);
        return;
      }
      case 'evenement':
        this.event = withRng(rs, (rng) => drawEvent(rs, rng));
        this.screen = 'event';
        this.renderer.drawMap(null);
        this.renderer.drawOverlay(eventScreen(this.event));
        return;
      case 'marchand':
        this.shop = makeShop(rs);
        this.showShop();
        return;
      case 'repos':
        this.screen = 'rest';
        this.renderer.drawMap(null);
        this.renderer.drawOverlay(restScreen(rs));
        return;
      case 'tresor':
        this.treasure = withRng(rs, (rng) => offerCharms(rs, rng, 3));
        this.screen = 'treasure';
        this.renderer.drawMap(null);
        this.renderer.drawOverlay(treasureScreen(this.treasure, rs.charms.length));
        return;
    }
  }

  private startCombat(entry: PoolEntry, elite: boolean, persist = true): void {
    const rs = this.runState;
    if (!rs) return;
    rs.roomId = entry.id;
    rs.roomElite = elite;
    if (persist) this.persist();
    this.enterRoom(entry, { hp: rs.hp, charge: rs.charge, form: rs.form, element: rs.element }, modsFor(rs, elite), elite);
  }

  private showShop(): void {
    const rs = this.runState;
    if (!rs || !this.shop) return;
    this.screen = 'shop';
    this.renderer.drawMap(null);
    this.renderer.drawOverlay(shopScreen(rs, this.shop));
  }

  /** Le nœud courant est réglé : acte suivant après un boss, fin de run, ou retour à la carte. */
  private finishNode(): void {
    const rs = this.runState;
    if (!rs) {
      this.showTitle();
      return;
    }
    leaveNode(rs);
    if (rs.phase === 'won') {
      this.storage.clearSave();
      this.screen = 'end';
      this.renderer.drawMap(null);
      this.renderer.drawOverlay(runWonScreen(summary(rs)));
      return;
    }
    this.persist();
    this.showRunMap(false);
  }

  private endRunDead(): void {
    const rs = this.runState;
    if (!rs) {
      this.showTitle();
      return;
    }
    die(rs);
    this.storage.clearSave();
    this.screen = 'end';
    this.renderer.drawMap(null);
    this.renderer.drawOverlay(runDeadScreen(summary(rs)));
  }

  // Écrans -------------------------------------------------------------------

  private showTitle(): void {
    this.screen = 'title';
    this.runState = null;
    this.renderer.drawMap(null);
    this.renderer.drawOverlay(titleScreen(this.hasSave(), this.options.version ?? '0'));
  }

  private showOptions(from: 'title' | 'pause'): void {
    this.optionsFrom = from;
    this.screen = 'options';
    this.renderer.drawMap(null);
    const names = this.baseEntries().map((e) => e.spec.name);
    this.renderer.drawOverlay(optionsScreen(this.settings, names, this.testRoomIndex, from));
  }

  private showCredits(): void {
    this.screen = 'credits';
    this.renderer.drawOverlay(creditsScreen(this.credits, this.creditsPage));
  }

  private showPause(): void {
    this.screen = 'pause';
    this.gesture.reset();
    this.prediction = null;
    this.renderer.drawMap(null);
    this.renderer.drawOverlay(pauseScreen(this.entry.spec.name));
  }

  private onCombatWon(): void {
    const rs = this.runState;
    if (!rs) {
      this.showTitle();
      return;
    }
    const state = this.run.state;
    const hero = this.run.hero;
    const kills = this.entry.spec.enemies.length - this.run.enemies().length;
    const boss = this.entry.kind === 'boss';
    const { plumes } = completeCombat(rs, {
      hp: hero.hp,
      charge: hero.charge,
      form: hero.form,
      element: hero.element,
      kills,
      turns: state.turn,
      damageTaken: state.heroHits,
      contractDone: state.contractDone ?? false,
      elite: this.roomElite,
      boss,
    });
    rs.roomId = null;
    const contractLine = state.contract
      ? state.contractDone
        ? `Contrat rempli, ${contractGoal(state.contract)} : ${rewardLabel(state.contract.reward)}.`
        : `Contrat manqué : ${contractGoal(state.contract)}.`
      : null;
    const spec = combatWonScreen(this.entry.spec.name, state.turn, plumes, contractLine, this.roomElite);
    const stars = state.turn <= this.entry.turns ? 3 : state.turn <= this.entry.turns + 1 ? 2 : 1;
    spec.lines.unshift('★'.repeat(stars) + '☆'.repeat(3 - stars));
    this.screen = 'won';
    this.renderer.drawOverlay(spec);
  }

  /** Après l'écran de victoire : récompense en attente, puis suite du run. */
  private afterCombat(): void {
    const rs = this.runState;
    if (!rs) {
      this.showTitle();
      return;
    }
    const reward = rs.reward;
    if (!reward) {
      this.finishNode();
      return;
    }
    this.screen = 'reward';
    if (reward.kind === 'form') this.renderer.drawOverlay(formChoiceScreen(this.run.state.turn, rs.element));
    else if (reward.kind === 'element') this.renderer.drawOverlay(elementScreen(this.run.state.turn, rs.form));
    else this.renderer.drawOverlay(charmRewardScreen(reward.options, this.entry.kind === 'boss' ? 'boss' : 'elite', rs.charms.length));
  }

  private onCombatLost(): void {
    const rs = this.runState;
    if (rs && canRevive(rs) && this.run.revive()) {
      useRevive(rs);
      this.screen = 'lost';
      this.renderer.burst('glow', this.run.heroPosition().x, this.run.heroPosition().y, 12);
      this.renderer.drawOverlay({ title: 'Œuf de secours !', lines: ['La coquille éclate, Dodu se relève avec un cœur.'], buttons: [{ id: 'resume', label: 'Continuer' }] });
      return;
    }
    this.endRunDead();
  }

  /** Bouton d'écran. Les identifiants sont le contrat des constructeurs d'écrans. */
  private onOverlayButton(id: string): void {
    const rs = this.runState;
    switch (id) {
      case 'new-run': {
        const forced = this.settings.test.enabled ? (this.baseEntries()[this.testRoomIndex] ?? null) : null;
        this.startRun(forced);
        return;
      }
      case 'continue-run': {
        const save = this.storage.loadSave();
        if (save) this.resumeRun(save.run);
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
        if (rs) this.showRunMap(true);
        return;
      case 'charms-pause':
        if (rs) {
          this.screen = 'charms';
          this.renderer.drawOverlay(charmsScreen(rs));
        }
        return;
      case 'resume':
        this.screen = 'room';
        this.renderer.drawMap(null);
        this.renderer.drawOverlay(null);
        return;
      case 'quit':
        this.persist();
        this.showTitle();
        return;
      case 'restart':
        this.startRun(null);
        return;
      case 'continue':
        this.afterCombat();
        return;
      case 'leave':
        this.finishNode();
        return;
      case 'heal':
        if (rs && this.shop && buyHeal(rs, this.shop)) this.audio?.play({ key: 'heal', volume: 0.9, semitones: 0 });
        this.showShop();
        return;
      case 'reroll':
        if (rs && this.shop) reroll(rs, this.shop);
        this.showShop();
        return;
      case 'equip-element':
        if (rs) chooseElement(rs);
        this.finishNode();
        return;
      default:
        break;
    }
    if (id.startsWith('form:')) {
      if (rs) chooseForm(rs, id.slice(5) as HeroForm);
      this.finishNode();
      return;
    }
    if (id.startsWith('node:')) {
      this.enterNode(id.slice(5));
      return;
    }
    if (id.startsWith('buy:')) {
      if (rs && this.shop && buyCharm(rs, this.shop, Number(id.slice(4)))) this.audio?.play({ key: 'chargeUp', volume: 0.8, semitones: 7 });
      this.showShop();
      return;
    }
    if (id.startsWith('choice:')) {
      if (rs && this.event) {
        const choice = this.event.choices.find((c) => c.id === id.slice(7));
        if (!choice) return;
        const outcome = withRng(rs, (rng) => choice.apply(rs, rng));
        if (rs.hp <= 0) {
          this.endRunDead();
          return;
        }
        this.renderer.drawOverlay(eventOutcomeScreen(this.event, outcome));
      }
      return;
    }
    if (id.startsWith('rest:')) {
      if (rs && (id === 'rest:soigner' || id === 'rest:veiller')) {
        restChoice(rs, id.slice(5) as 'soigner' | 'veiller');
      }
      this.finishNode();
      return;
    }
    if (id.startsWith('charm:')) {
      const choice = id.slice(6);
      if (rs) {
        if (this.screen === 'treasure') {
          if (choice !== 'none' && this.treasure.includes(choice as CharmId)) takeCharm(rs, choice as CharmId);
        } else {
          chooseCharm(rs, choice === 'none' ? null : (choice as CharmId));
        }
        this.applySettings();
      }
      this.finishNode();
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
        this.testRoomIndex = (this.testRoomIndex + 1) % Math.max(1, this.baseEntries().length);
        break;
      default:
        return;
    }
    this.applySettings();
    this.showOptions(this.optionsFrom);
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
      if (this.screen === 'map') {
        const hit = this.renderer.hitMap(input.x, input.y);
        if (hit) {
          this.audio?.play({ key: 'uiTap', volume: 0.8, semitones: 0 });
          this.onOverlayButton(hit);
        }
        return;
      }
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
      if (this.run.phase !== 'aim' || this.cinematic.length > 0) return;
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
    if (this.screen !== 'room' || this.cinematic.length > 0) return false;
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
    this.cinematicMs += frameMs;
    while (this.cinematic.length > 0 && this.cinematic[0]!.at <= this.cinematicMs) {
      const step = this.cinematic.shift()!;
      step.run();
    }
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
    // Les événements de résolution du tour se jouent à l'écran les uns après les autres ; le reste est immédiat.
    let at = 0;
    for (const event of events) {
      if (!isTurnEvent(event)) {
        this.feedbackForEvent(event);
        continue;
      }
      at = this.scheduleTurnEvent(event, at);
    }
  }

  /** Programme la présentation d'un événement de fin de tour ; renvoie l'instant suivant. */
  private scheduleTurnEvent(event: RuleEvent, at: number): number {
    const later = (delayMs: number, fn: () => void): void => {
      this.cinematic.push({ at: this.cinematicMs + delayMs, run: fn });
    };
    switch (event.type) {
      case 'stun':
        later(at, () => this.feedbackForEvent(event));
        return at + 80;
      case 'heroHit':
      case 'blocked': {
        const h = this.run.heroPosition();
        if (event.type === 'heroHit') this.pendingHits++;
        later(at + 120, () => this.renderer.lunge(event.entity, h.x, h.y));
        later(at + 300, () => {
          if (event.type === 'heroHit') this.pendingHits--;
          this.feedbackForEvent(event);
        });
        return at + 520;
      }
      case 'enemyHeal':
      case 'place':
        later(at + 100, () => this.feedbackForEvent(event));
        return at + 260;
      case 'move':
        later(at, () => this.feedbackForEvent(event));
        return at + 110;
      case 'turn':
        later(at + 120, () => this.feedbackForEvent(event));
        return at + 200;
      default:
        later(at + 250, () => this.feedbackForEvent(event));
        return at + 300;
    }
  }

  private feedbackForContact(c: ContactEvent, hero: Entity): void {
    const strength = Math.min(1, c.impactSpeed / 12);
    if (c.impactSpeed < 1) return;
    if (c.impactSpeed >= 9) this.renderer.shake(2 + strength * 4);
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
        this.renderer.floatText(event.x, event.y, `−${event.amount}`, 0xfde68a, this.comboIndex >= 2 ? 26 : 22);
        if (this.comboIndex >= 2) this.renderer.shake(2);
        return;
      case 'death':
        this.hitStopMs = Math.max(this.hitStopMs, TIME.hitStopMs);
        this.renderer.burst('dust', event.x, event.y, 10);
        this.renderer.floatText(event.x, event.y - 0.4, 'K.O.', 0xf87171, 26);
        this.renderer.shake(5);
        if (this.run.enemies().length === 0) {
          this.slowMoRemainingMs = TIME.slowMoMs;
          this.skipping = false;
        }
        break;
      case 'break':
        this.hitStopMs = Math.max(this.hitStopMs, event.breakableKind === 'crate' ? TIME.hitStopMs : TIME.bigHitStopMs);
        this.renderer.burst(event.breakableKind === 'crate' || event.breakableKind === 'barricade' ? 'wood' : 'stone', event.x, event.y, 10);
        if (event.breakableKind === 'column') this.renderer.shake(6);
        break;
      case 'crack':
        this.renderer.burst('dust', event.x, event.y, 4);
        this.renderer.floatText(event.x, event.y, 'crac', 0x9ca3af, 16);
        break;
      case 'explosion':
        this.hitStopMs = Math.max(this.hitStopMs, TIME.bigHitStopMs);
        this.renderer.burst('glow', event.x, event.y, 8);
        this.renderer.burst('spark', event.x, event.y, 16);
        this.renderer.burst('dust', event.x, event.y, 12);
        this.renderer.shake(10);
        this.renderer.flash(0.55);
        break;
      case 'shield':
        this.renderer.burst('spark', event.x, event.y, 6);
        this.renderer.floatText(event.x, event.y, 'Bloc !', 0xcbd5e1, 18);
        break;
      case 'enemyHeal':
        this.renderer.burst('glow', event.x, event.y, 4);
        this.renderer.floatText(event.x, event.y, `+${event.amount}`, 0x4ade80, 20);
        break;
      case 'place':
        this.renderer.burst('dust', event.x, event.y, 6);
        break;
      case 'contract': {
        if (!event.done) break;
        const h = this.run.heroPosition();
        this.renderer.burst('glow', h.x, h.y, 10);
        this.renderer.floatText(h.x, h.y - 0.6, 'Contrat rempli !', 0x4ade80, 20);
        break;
      }
      case 'replay': {
        const h = this.run.heroPosition();
        this.renderer.burst('spark', h.x, h.y, 10);
        this.renderer.flash(0.2);
        this.renderer.floatText(h.x, h.y - 0.6, event.reason === 'kill' ? 'Rejoue !' : 'Second lancer', 0xfde68a, 24);
        break;
      }
      case 'move':
        this.renderer.hop(event.entity, event.fromX - event.toX, event.fromY - event.toY);
        this.renderer.burst('dust', event.toX, event.toY + 0.3, 2);
        break;
      case 'stun': {
        const pos = this.enemyPosition(event.entity);
        if (pos) this.renderer.floatText(pos.x, pos.y - 0.5, 'Sonné', 0xfde047, 18);
        break;
      }
      case 'blocked': {
        const h = this.run.heroPosition();
        this.renderer.burst('glow', h.x, h.y, 6);
        this.renderer.floatText(h.x, h.y - 0.6, 'Bloqué !', 0x93c5fd, 20);
        break;
      }
      case 'turn':
        this.renderer.telegraph();
        break;
      case 'fall':
        this.renderer.burst('dust', event.x, event.y, 6);
        if (event.kind === 'hero') {
          this.sinceHeroHit = 0;
          this.renderer.floatText(event.x, event.y, '−1', 0xf87171, 24);
        } else if (this.run.enemies().length === 0) {
          this.slowMoRemainingMs = TIME.slowMoMs;
          this.skipping = false;
        }
        break;
      case 'heroHit': {
        this.sinceHeroHit = 0;
        this.renderer.shake(4);
        this.renderer.flash(0.25);
        const h = this.run.heroPosition();
        this.renderer.floatText(h.x, h.y - 0.3, `−${event.amount}`, 0xf87171, 26);
        break;
      }
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
        this.onCombatWon();
        break;
      case 'lost':
        this.onCombatLost();
        break;
      default:
        break;
    }
    for (const cue of cuesForEvent(event, this.comboIndex)) this.audio?.play(cue);
  }

  private enemyPosition(entity: Entity): Vec2 | null {
    const { world } = this.run.sim;
    if (!world.exists(entity)) return null;
    const t = world.get(entity, Transform);
    return t ? { x: t.x, y: t.y } : null;
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
    if (this.screen === 'map') return;
    this.renderer.drawStatics(world);
    const objective = this.run.state.objective;
    this.renderer.drawGoal(objective.type === 'push' ? objective.goal : null);
    this.renderer.drawZones(this.activeZones());
    this.renderer.drawTrail(this.trail);
    this.renderer.drawDynamics(world, this.run.heroEntity, this.expressions, dt, this.roomElite);
    this.renderer.setHeroTint(this.run.heroEntity, hero.form);
    const aiming = this.gesture.active && this.gesture.aim.armed && this.run.phase === 'aim';
    this.renderer.anticipate(this.run.heroEntity, aiming ? this.gesture.aim.dirX : 0, aiming ? this.gesture.aim.dirY : 0, aiming ? this.gesture.aim.power : 0);
    const preview = this.prediction && this.gesture.active ? disclose(this.prediction, this.disclosure) : null;
    this.renderer.drawPreview(preview, this.run.heroRadius(), this.marker);
    this.renderer.drawHud({
      hp: Math.min(hero.maxHp, hero.hp + this.pendingHits),
      maxHp: hero.maxHp,
      roomName: `${this.entry.spec.name}${this.roomElite ? ' · élite' : ''}`,
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
      combo: this.run.phase === 'moving' ? this.comboIndex : 0,
      plumes: this.runState?.plumes ?? null,
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
    const rs = this.runState;
    return {
      screen: this.screen,
      room: this.entry.id,
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
      act: rs?.act ?? 0,
      nodeType: rs ? (currentNode(rs)?.type ?? null) : null,
      plumes: rs?.plumes ?? 0,
      charms: rs?.charms ?? [],
      reachable: rs ? reachable(rs).map((n) => n.id) : [],
      busy: this.cinematic.length > 0,
    };
  }
}

