import type { Die, RolledDie } from './types';
import type { Rng } from './rng';

export const STARTING_DICE = 2;
export const MAX_DICE = 5;
export const DEFAULT_FACES = [1, 2, 3, 4, 5, 6];

export function makeDie(id: string, faces: number[] = DEFAULT_FACES): Die {
  return { id, faces: [...faces], tier: 0 };
}

export function startingDice(): Die[] {
  return Array.from({ length: STARTING_DICE }, (_, i) => makeDie(`d${i}`));
}

/** Rolls every die that is not held; held dice keep their value and stay held. */
export function rollDice(dice: Die[], previous: RolledDie[], rng: Rng): RolledDie[] {
  return dice.map((die) => {
    const prior = previous.find((r) => r.dieId === die.id);
    if (prior?.held) return prior;
    return { dieId: die.id, value: rng.pick(die.faces), held: false };
  });
}

/**
 * Bumps the die's lowest face up by one pip (capped at 6) and raises its tier.
 * Targeting the weakest face is what makes the upgrade feel reliably good.
 */
export function upgradeDie(die: Die): Die {
  const faces = [...die.faces];
  let lowestIndex = 0;
  for (let i = 1; i < faces.length; i++) {
    if ((faces[i] as number) < (faces[lowestIndex] as number)) lowestIndex = i;
  }
  faces[lowestIndex] = Math.min(6, (faces[lowestIndex] as number) + 1);
  return { ...die, faces, tier: die.tier + 1 };
}
