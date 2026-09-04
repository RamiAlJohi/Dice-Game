import type { RunState, Upgrade } from './types';
import { Rng, randomSeed } from './rng';
import { rollDice, startingDice } from './dice';
import { detectCombo, COMBO_LABELS } from './combos';
import { computeDamage, xpForStage, xpToLevel } from './combat';
import { BOSS_STAGE, makeEnemy } from './enemies';
import { applyUpgrade, rollUpgrades } from './upgrades';

export const STARTING_HP = 100;
export const STARTING_MAX_ROLLS = 3;
/** Fraction of max HP restored on clearing a stage. */
export const STAGE_CLEAR_HEAL = 0.10;
const LOG_LIMIT = 30;

/**
 * Every transition below is pure: it takes state plus the caller's Rng and
 * returns fresh state. The Rng is passed in rather than rebuilt from
 * (seed, cursor) because replaying the generator on each call would make the
 * balance simulation quadratic.
 */

function log(state: RunState, line: string): string[] {
  return [line, ...state.log].slice(0, LOG_LIMIT);
}

/** Fresh roll of all dice, opening a new round. */
function beginRound(state: RunState, rng: Rng): RunState {
  return {
    ...state,
    roll: rollDice(state.dice, [], rng),
    rollsUsed: 1,
    rngCursor: rng.cursor,
  };
}

export function createRun(seed: string = randomSeed()): { state: RunState; rng: Rng } {
  const rng = new Rng(seed);
  const dice = startingDice();
  const base: RunState = {
    seed,
    rngCursor: 0,
    phase: 'rolling',
    dice,
    roll: [],
    rollsUsed: 0,
    maxRolls: STARTING_MAX_ROLLS,
    relics: [],
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    level: 1,
    xp: 0,
    stage: 1,
    roundsThisStage: 0,
    enemy: makeEnemy(1, rng),
    offeredUpgrades: [],
    log: ['Stage 1. Roll to begin.'],
  };
  return { state: beginRound(base, rng), rng };
}

/** Rerolls unheld dice. No-op once the round's rolls are spent. */
export function reroll(state: RunState, rng: Rng): RunState {
  if (state.phase !== 'rolling' || state.rollsUsed >= state.maxRolls) return state;
  return {
    ...state,
    roll: rollDice(state.dice, state.roll, rng),
    rollsUsed: state.rollsUsed + 1,
    rngCursor: rng.cursor,
  };
}

export function toggleHold(state: RunState, dieId: string): RunState {
  if (state.phase !== 'rolling') return state;
  return {
    ...state,
    roll: state.roll.map((r) => (r.dieId === dieId ? { ...r, held: !r.held } : r)),
  };
}

/**
 * Scores the current dice, applies damage both ways, and advances the run.
 * Resolution order is deliberate: the player always lands their hit before the
 * enemy swings, so a lethal roll on the last sliver of HP still wins.
 */
export function resolveRound(state: RunState, rng: Rng): RunState {
  if (state.phase !== 'rolling') return state;

  const combo = detectCombo(state.roll.map((r) => r.value));
  const damage = computeDamage(combo, state.relics);
  const enemyHp = Math.max(0, state.enemy.hp - damage.total);

  let next: RunState = {
    ...state,
    enemy: { ...state.enemy, hp: enemyHp },
    roundsThisStage: state.roundsThisStage + 1,
    log: log(state, `${COMBO_LABELS[combo.kind]} — ${damage.total} damage.`),
  };

  if (enemyHp === 0) return onEnemyDefeated(next, rng);

  // Enemy retaliates on cadence.
  if (next.roundsThisStage % next.enemy.cadence === 0) {
    const hp = Math.max(0, next.hp - next.enemy.damage);
    next = {
      ...next,
      hp,
      log: log(next, `${next.enemy.name} hits you for ${next.enemy.damage}.`),
    };
    if (hp === 0) {
      return { ...next, phase: 'lost', rngCursor: rng.cursor, log: log(next, 'You fall. Run over.') };
    }
  }

  return beginRound(next, rng);
}

function onEnemyDefeated(state: RunState, rng: Rng): RunState {
  const defeated: RunState = { ...state, log: log(state, `${state.enemy.name} defeated!`) };

  if (defeated.stage >= BOSS_STAGE) {
    return { ...defeated, phase: 'won', rngCursor: rng.cursor, log: log(defeated, 'The Dice Tyrant falls. You win.') };
  }

  const nextStage = defeated.stage + 1;
  // A small heal per stage keeps runs about efficiency rather than pure attrition:
  // without it, chip damage alone decides the run long before the boss.
  const healed = Math.min(defeated.maxHp, defeated.hp + Math.round(defeated.maxHp * STAGE_CLEAR_HEAL));
  let next: RunState = {
    ...defeated,
    hp: healed,
    xp: defeated.xp + xpForStage(defeated.stage),
    stage: nextStage,
    roundsThisStage: 0,
    enemy: makeEnemy(nextStage, rng),
  };

  // A single level per stage clear keeps the pacing readable; surplus XP carries.
  if (next.xp >= xpToLevel(next.level)) {
    next = {
      ...next,
      xp: next.xp - xpToLevel(next.level),
      level: next.level + 1,
      phase: 'choosing-upgrade',
      offeredUpgrades: rollUpgrades(next, rng),
      log: log(next, `Level ${next.level + 1}! Choose an upgrade.`),
    };
    return { ...next, rngCursor: rng.cursor };
  }

  return beginRound({ ...next, log: log(next, `Stage ${nextStage}: ${next.enemy.name}.`) }, rng);
}

export function chooseUpgrade(state: RunState, upgradeId: string, rng: Rng): RunState {
  if (state.phase !== 'choosing-upgrade') return state;
  const upgrade: Upgrade | undefined = state.offeredUpgrades.find((u) => u.id === upgradeId);
  if (!upgrade) return state;

  const upgraded = applyUpgrade(state, upgrade);
  const next: RunState = {
    ...upgraded,
    phase: 'rolling',
    offeredUpgrades: [],
    log: log(upgraded, `Took ${upgrade.name}. Stage ${upgraded.stage}: ${upgraded.enemy.name}.`),
  };
  return beginRound(next, rng);
}
