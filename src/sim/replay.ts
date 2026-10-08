/**
 * Rejeu : reconstruit une salle et rejoue un journal d'entrées pas à pas.
 * Le résultat doit être identique à la partie d'origine, à l'octet près.
 */
import type { ContactHook } from '../core/physics';
import type { RoomSpec } from './room';
import { DEFAULT_SIM, Simulation, type SimConfig, type SimInput } from './simulation';

export function replay(
  spec: RoomSpec,
  inputs: readonly SimInput[],
  config: SimConfig = DEFAULT_SIM,
  hook?: ContactHook,
): Simulation {
  const sim = Simulation.fromRoom(spec, config, hook);
  const ordered = [...inputs].sort((a, b) => a.step - b.step);
  for (const input of ordered) {
    while (sim.step < input.step) sim.tick();
    if (input.type === 'throw') sim.throwHero(input.vx, input.vy);
    else sim.brake();
  }
  sim.runUntilRest();
  return sim;
}
