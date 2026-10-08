/**
 * Orchestration d'une salle : le tour en six étapes du GDD.
 *
 * 1. Les ennemis affichent leurs intentions (zones figées au sol).
 * 2. Le joueur vise et lance.
 * 3. Le héros traverse la salle, percute, rebondit, s'immobilise.
 * 4. Les collisions se résolvent : dégâts et casse pendant le mouvement, puis
 *    sonné, objectif et chutes à l'arrêt.
 * 5. Les ennemis vivants et non sonnés frappent dans leurs zones.
 * 6. Nouvelles intentions.
 *
 * Tout l'état vit dans le monde ECS ; cet objet n'est qu'un orchestrateur et
 * se clone en clonant la simulation.
 */
import type { Entity } from '../../core/ecs/world';
import { CircleBody, Transform } from '../../core/physics';
import { RULES } from '../archetypes';
import { Enemy, Hero, Pushable, RoomState, type RoomPhase, type RuleEvent } from '../components';
import { chooseIntent } from '../intents';
import { traceMotion, type Prediction } from '../lookahead';
import { buildRoom, DEFAULT_CARRY, HERO_BODY, type HeroCarry, type RoomSpec } from '../room';
import { DEFAULT_SIM, Simulation, type SimConfig } from '../simulation';
import { circleInsideZone, circleIntersectsZone } from '../zones';
import { contactRules, roomEntity } from './contacts';
import { TICK_SYSTEMS } from './systems';

export class RoomRun {
  private constructor(
    readonly sim: Simulation,
    readonly room: Entity,
    readonly spec: RoomSpec,
  ) {}

  static fromSpec(spec: RoomSpec, carry: HeroCarry = DEFAULT_CARRY, config: SimConfig = DEFAULT_SIM): RoomRun {
    const { world, hero, room } = buildRoom(spec, carry);
    const sim = new Simulation(world, hero, config, contactRules, TICK_SYSTEMS);
    const run = new RoomRun(sim, room, spec);
    run.beginTurn();
    return run;
  }

  get state(): RoomState {
    return this.sim.world.require(this.room, RoomState);
  }

  get phase(): RoomPhase {
    return this.state.phase;
  }

  get heroEntity(): Entity {
    return this.sim.hero;
  }

  get hero(): Hero {
    return this.sim.world.require(this.sim.hero, Hero);
  }

  heroPosition(): { x: number; y: number } {
    const t = this.sim.world.require(this.sim.hero, Transform);
    return { x: t.x, y: t.y };
  }

  heroRadius(): number {
    return this.sim.world.require(this.sim.hero, CircleBody).radius;
  }

  /** État transportable vers la salle suivante. */
  carry(): HeroCarry {
    const h = this.hero;
    return { hp: h.hp, charge: h.charge, form: h.form };
  }

  /** Ennemis vivants, par identifiant croissant. */
  enemies(): Entity[] {
    return this.sim.world.query(Enemy, Transform);
  }

  /** Zones de frappe actives, celles des ennemis vivants et non sonnés. */
  activeZones(): Array<{ entity: Entity; zones: RoomState['log'] extends unknown ? Enemy['intent'] : never }> {
    return this.enemies()
      .map((entity) => ({ entity, zones: this.sim.world.require(entity, Enemy).intent }))
      .filter(({ entity, zones }) => zones !== null && !this.sim.world.require(entity, Enemy).stunned);
  }

  /** Étape 6 puis 1 : nouvelles intentions, remise à zéro des déplacements. */
  private beginTurn(): void {
    const { world } = this.sim;
    const state = this.state;
    state.turn++;
    // Les événements de contact du tour précédent ne servent plus : on évite une liste qui grossit sans fin.
    this.sim.events.length = 0;
    const hero = this.hero;
    hero.strongThrow = false;
    hero.strongPassUsed = false;
    const heroPos = this.heroPosition();
    for (const entity of this.enemies()) {
      const enemy = world.require(entity, Enemy);
      const t = world.require(entity, Transform);
      enemy.turnStartX = t.x;
      enemy.turnStartY = t.y;
      enemy.stunned = false;
      enemy.intent = chooseIntent(enemy.archetype, { x: t.x, y: t.y }, heroPos, enemy.cycleIndex);
      enemy.cycleIndex++;
    }
    state.phase = 'aim';
    state.log.push({ type: 'turn', turn: state.turn });
  }

  /** Étape 2 : lancer avec une direction unitaire et une puissance dans [0, 1]. */
  throwHero(dirX: number, dirY: number, power: number): boolean {
    const state = this.state;
    if (state.phase !== 'aim') return false;
    const hero = this.hero;
    const body = this.sim.world.require(this.sim.hero, CircleBody);
    const origin = this.heroPosition();
    hero.throwOriginX = origin.x;
    hero.throwOriginY = origin.y;
    hero.strongThrow = hero.form !== 'none' && hero.charge >= hero.chargeMax;
    hero.strongPassUsed = false;
    if (hero.strongThrow) hero.charge = 0;
    if (hero.form === 'pierre') {
      body.mass = hero.strongThrow ? RULES.pierreStrongMass : RULES.pierreWeakMass;
      body.restitution = RULES.pierreWeakRestitution;
    } else {
      body.mass = HERO_BODY.mass;
      body.restitution = HERO_BODY.restitution;
    }
    const speed = power * this.sim.config.launchSpeed;
    if (!this.sim.throwHero(dirX * speed, dirY * speed)) return false;
    state.phase = 'moving';
    hero.lastContactStep = this.sim.step;
    return true;
  }

  /** Frein : une seule fois par salle. */
  brake(): boolean {
    const hero = this.hero;
    if (this.state.phase !== 'moving' || !hero.brakeAvailable) return false;
    if (!this.sim.brake()) return false;
    hero.brakeAvailable = false;
    return true;
  }

  /** Un pas de mouvement sans résolution de tour. Renvoie les événements de règles du pas. */
  stepMotion(): RuleEvent[] {
    if (this.state.phase !== 'moving') return [];
    this.sim.tick();
    return this.state.log.splice(0);
  }

  /** Un pas complet : mouvement, puis résolution du tour à l'immobilisation. */
  tick(): RuleEvent[] {
    const events = this.stepMotion();
    if (this.state.phase === 'moving' && this.sim.phase === 'idle') {
      this.resolveTurn();
      events.push(...this.state.log.splice(0));
    }
    return events;
  }

  /** Étapes 4 à 6. */
  private resolveTurn(): void {
    const { world } = this.sim;
    const state = this.state;
    const hero = this.hero;

    for (const entity of this.enemies()) {
      const enemy = world.require(entity, Enemy);
      const t = world.require(entity, Transform);
      const dx = t.x - enemy.turnStartX;
      const dy = t.y - enemy.turnStartY;
      if (Math.sqrt(dx * dx + dy * dy) >= RULES.stunDisplacement) {
        enemy.stunned = true;
        state.log.push({ type: 'stun', entity });
      }
    }

    if (hero.hp <= 0) {
      state.phase = 'lost';
      state.log.push({ type: 'lost' });
      return;
    }

    if (this.objectiveComplete()) {
      state.phase = 'won';
      state.log.push({ type: 'won' });
      return;
    }

    const heroPos = this.heroPosition();
    const heroRadius = this.heroRadius();
    for (const entity of this.enemies()) {
      const enemy = world.require(entity, Enemy);
      if (enemy.stunned || !enemy.intent) continue;
      for (const zone of enemy.intent.zones) {
        if (!circleIntersectsZone(heroPos.x, heroPos.y, heroRadius, zone)) continue;
        hero.hp -= 1;
        state.log.push({ type: 'heroHit', amount: 1, entity });
      }
    }
    if (hero.hp <= 0) {
      state.phase = 'lost';
      state.log.push({ type: 'lost' });
      return;
    }
    this.beginTurn();
  }

  objectiveComplete(): boolean {
    const { world } = this.sim;
    const objective = this.state.objective;
    if (objective.type === 'eliminate') return this.enemies().length === 0;
    if (!world.exists(objective.object) || !world.has(objective.object, Pushable)) return false;
    const t = world.require(objective.object, Transform);
    const r = world.require(objective.object, CircleBody).radius;
    return circleInsideZone(t.x, t.y, r, objective.goal);
  }

  /** Joue jusqu'à la fin du tour en cours. Renvoie le nombre de pas. */
  runUntilTurnEnd(): number {
    const start = this.sim.step;
    while (this.state.phase === 'moving') this.tick();
    return this.sim.step - start;
  }

  clone(): RoomRun {
    return new RoomRun(this.sim.clone(), this.room, this.spec);
  }

  snapshot(): string {
    return this.sim.snapshot();
  }
}

/** Prédit un lancer avec la forme et la charge courantes, sans résoudre le tour. */
export function predictRoomThrow(run: RoomRun, dirX: number, dirY: number, power: number): Prediction {
  const probe = run.clone();
  const start = probe.heroPosition();
  if (!probe.throwHero(dirX, dirY, power)) {
    return { path: [start], firstContact: null, stop: start, touchedDynamic: false, steps: 0, completed: true };
  }
  return traceMotion(probe.sim, start);
}

export { roomEntity };
