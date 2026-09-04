import { describe, expect, it } from 'vitest';
import { computeDamage } from '../combat';
import { detectCombo } from '../combos';
import type { Relic } from '../types';

const relic = (over: Partial<Relic>): Relic => ({
  id: 'r',
  name: 'Test Relic',
  description: '',
  appliesTo: [],
  bonusFlat: 0,
  bonusMultiplier: 1,
  ...over,
});

describe('computeDamage', () => {
  it('rewards higher pips within the same combo kind', () => {
    const low = computeDamage(detectCombo([2, 2]), []);
    const high = computeDamage(detectCombo([6, 6]), []);
    expect(high.total).toBeGreaterThan(low.total);
  });

  it('ranks combo kinds in the intended order', () => {
    const hands = [
      [1, 3, 5],
      [6, 6, 1],
      [2, 2, 5, 5],
      [5, 5, 5],
      [1, 2, 3, 4],
      [3, 3, 3, 5, 5],
      [6, 6, 6, 6],
      [1, 2, 3, 4, 5],
      [6, 6, 6, 6, 6],
    ];
    const damages = hands.map((h) => computeDamage(detectCombo(h), []).total);
    const ascending = [...damages].sort((a, b) => a - b);
    expect(damages).toEqual(ascending);
  });

  it('applies a global relic to every combo', () => {
    const r = relic({ bonusFlat: 6 });
    const withRelic = computeDamage(detectCombo([2, 2]), [r]);
    const without = computeDamage(detectCombo([2, 2]), []);
    expect(withRelic.total).toBeGreaterThan(without.total);
    expect(withRelic.relicFlat).toBe(6);
  });

  it('only applies a targeted relic to its own combo kinds', () => {
    const r = relic({ appliesTo: ['pair'], bonusMultiplier: 2 });
    const onPair = computeDamage(detectCombo([4, 4]), [r]);
    const onTriple = computeDamage(detectCombo([4, 4, 4]), [r]);
    expect(onPair.relicMultiplier).toBe(2);
    expect(onTriple.relicMultiplier).toBe(1);
  });

  it('stacks multiple relics multiplicatively', () => {
    const a = relic({ id: 'a', bonusMultiplier: 1.5 });
    const b = relic({ id: 'b', bonusMultiplier: 2 });
    expect(computeDamage(detectCombo([3, 3]), [a, b]).relicMultiplier).toBe(3);
  });

  it('never deals less than 1 damage', () => {
    const cursed = relic({ bonusFlat: -1000 });
    expect(computeDamage(detectCombo([1, 2]), [cursed]).total).toBe(1);
  });

  it('always returns a whole number of damage', () => {
    const r = relic({ bonusMultiplier: 1.15 });
    for (const hand of [[1, 2], [3, 3, 5], [2, 3, 4, 5]]) {
      const total = computeDamage(detectCombo(hand), [r]).total;
      expect(Number.isInteger(total)).toBe(true);
    }
  });
});
