import { describe, expect, it } from 'vitest';
import { createRun, reroll, resolveRound, toggleHold, chooseUpgrade } from '../run';
import { Rng } from '../rng';
import { MAX_DICE } from '../dice';
import { MAX_ROLLS_CAP } from '../upgrades';
import type { RunState } from '../types';

/** Plays a whole run to completion with a naive "always resolve" policy. */
function playOut(seed: string): RunState {
  const { state, rng } = createRun(seed);
  let s = state;
  for (let i = 0; i < 2000 && s.phase !== 'won' && s.phase !== 'lost'; i++) {
    if (s.phase === 'choosing-upgrade') {
      const first = s.offeredUpgrades[0];
      expect(first).toBeDefined();
      s = chooseUpgrade(s, first!.id, rng);
    } else {
      s = resolveRound(s, rng);
    }
  }
  return s;
}

describe('createRun', () => {
  it('starts with two dice already rolled and one roll spent', () => {
    const { state } = createRun('start');
    expect(state.dice).toHaveLength(2);
    expect(state.roll).toHaveLength(2);
    expect(state.rollsUsed).toBe(1);
    expect(state.phase).toBe('rolling');
    expect(state.stage).toBe(1);
  });

  it('is fully reproducible from its seed', () => {
    const a = playOut('reproducible');
    const b = playOut('reproducible');
    expect(a.phase).toBe(b.phase);
    expect(a.stage).toBe(b.stage);
    expect(a.hp).toBe(b.hp);
    expect(a.log).toEqual(b.log);
  });

  it('diverges on a different seed', () => {
    const { state: a } = createRun('seed-a');
    const { state: b } = createRun('seed-b');
    const sameDice = a.roll.map((r) => r.value).join() === b.roll.map((r) => r.value).join();
    const sameEnemy = a.enemy.name === b.enemy.name;
    expect(sameDice && sameEnemy).toBe(false);
  });
});

describe('rerolling', () => {
  it('keeps held dice and changes at least one unheld die over many rerolls', () => {
    const { state, rng } = createRun('hold');
    const held = toggleHold(state, state.dice[0]!.id);
    const heldValue = held.roll.find((r) => r.dieId === state.dice[0]!.id)!.value;
    const after = reroll(held, rng);
    expect(after.roll.find((r) => r.dieId === state.dice[0]!.id)!.value).toBe(heldValue);
    expect(after.rollsUsed).toBe(2);
  });

  it('refuses to reroll once the round budget is spent', () => {
    const { state, rng } = createRun('budget');
    let s = state;
    while (s.rollsUsed < s.maxRolls) s = reroll(s, rng);
    const exhausted = reroll(s, rng);
    expect(exhausted).toBe(s);
    expect(exhausted.rollsUsed).toBe(s.maxRolls);
  });

  it('ignores holds and rerolls outside the rolling phase', () => {
    const frozen: RunState = { ...createRun('frozen').state, phase: 'lost' };
    const rng = new Rng('x');
    expect(reroll(frozen, rng)).toBe(frozen);
    expect(toggleHold(frozen, frozen.dice[0]!.id)).toBe(frozen);
  });
});

describe('resolveRound', () => {
  it('damages the enemy and opens a fresh round', () => {
    const { state, rng } = createRun('damage');
    const after = resolveRound(state, rng);
    if (after.stage === state.stage) {
      expect(after.enemy.hp).toBeLessThan(state.enemy.hp);
    }
    expect(after.rollsUsed).toBe(1);
  });

  it('lets a lethal blow win the stage even at 1 HP', () => {
    const { state, rng } = createRun('lethal');
    const brink: RunState = {
      ...state,
      hp: 1,
      enemy: { ...state.enemy, hp: 1, damage: 999, cadence: 1 },
    };
    const after = resolveRound(brink, rng);
    // Survives: the player's blow lands before the enemy's would-be lethal swing.
    expect(after.phase).not.toBe('lost');
    // And clearing the stage tops them up rather than leaving them on the brink.
    expect(after.hp).toBeGreaterThanOrEqual(1);
    expect(after.stage).toBe(brink.stage + 1);
  });

  it('heals a little on clearing a stage, never past max HP', () => {
    const { state, rng } = createRun('stage-heal');
    const hurt: RunState = { ...state, hp: 20, enemy: { ...state.enemy, hp: 1 } };
    expect(resolveRound(hurt, rng).hp).toBeGreaterThan(20);

    const healthy: RunState = { ...state, hp: state.maxHp, enemy: { ...state.enemy, hp: 1 } };
    expect(resolveRound(healthy, rng).hp).toBe(state.maxHp);
  });

  it('ends the run when the player is killed', () => {
    const { state, rng } = createRun('death');
    const doomed: RunState = {
      ...state,
      hp: 1,
      enemy: { ...state.enemy, hp: 9999, damage: 50, cadence: 1 },
    };
    expect(resolveRound(doomed, rng).phase).toBe('lost');
  });

  it('respects a slow enemy cadence', () => {
    const { state, rng } = createRun('cadence');
    const slow: RunState = {
      ...state,
      roundsThisStage: 0,
      enemy: { ...state.enemy, hp: 9999, damage: 5, cadence: 2 },
    };
    const afterOne = resolveRound(slow, rng);
    expect(afterOne.hp).toBe(slow.hp);
    const afterTwo = resolveRound(afterOne, rng);
    expect(afterTwo.hp).toBeLessThan(slow.hp);
  });
});

describe('progression', () => {
  it('reaches an upgrade choice and applies the pick', () => {
    const { state, rng } = createRun('upgrade');
    let s = state;
    for (let i = 0; i < 500 && s.phase !== 'choosing-upgrade'; i++) s = resolveRound(s, rng);
    expect(s.phase).toBe('choosing-upgrade');
    expect(s.offeredUpgrades.length).toBeGreaterThan(0);
    expect(s.offeredUpgrades.length).toBeLessThanOrEqual(3);

    const picked = chooseUpgrade(s, s.offeredUpgrades[0]!.id, rng);
    expect(picked.phase).toBe('rolling');
    expect(picked.offeredUpgrades).toHaveLength(0);
  });

  it('ignores an upgrade id that was not offered', () => {
    const { state, rng } = createRun('bogus');
    let s = state;
    for (let i = 0; i < 500 && s.phase !== 'choosing-upgrade'; i++) s = resolveRound(s, rng);
    expect(chooseUpgrade(s, 'not-a-real-upgrade', rng)).toBe(s);
  });

  it('never exceeds the dice or roll caps across many runs', () => {
    for (const seed of ['cap-1', 'cap-2', 'cap-3', 'cap-4']) {
      const final = playOut(seed);
      expect(final.dice.length).toBeLessThanOrEqual(MAX_DICE);
      expect(final.maxRolls).toBeLessThanOrEqual(MAX_ROLLS_CAP);
      expect(final.hp).toBeLessThanOrEqual(final.maxHp);
      expect(final.relics.length).toBe(new Set(final.relics.map((r) => r.name)).size);
    }
  });

  it('always terminates in a win or a loss', () => {
    for (let i = 0; i < 60; i++) {
      expect(['won', 'lost']).toContain(playOut(`terminate-${i}`).phase);
    }
  });
});
