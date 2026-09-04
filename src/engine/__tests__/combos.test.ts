import { describe, expect, it } from 'vitest';
import { detectCombo, longestStraight, COMBO_TABLE } from '../combos';

const kindOf = (values: number[]) => detectCombo(values).kind;

describe('longestStraight', () => {
  it('finds a run inside noisy values', () => {
    expect(longestStraight([2, 3, 4, 6])).toEqual([2, 3, 4]);
  });

  it('ignores duplicates when measuring a run', () => {
    expect(longestStraight([3, 3, 4, 5])).toEqual([3, 4, 5]);
  });

  it('returns a single value when nothing is consecutive', () => {
    expect(longestStraight([1, 3, 5])).toHaveLength(1);
  });

  it('handles the full 1-6 range', () => {
    expect(longestStraight([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('detectCombo', () => {
  it('identifies each combo kind', () => {
    expect(kindOf([4, 4, 4, 4, 4])).toBe('five-of-a-kind');
    expect(kindOf([1, 2, 3, 4, 5])).toBe('large-straight');
    expect(kindOf([6, 6, 6, 6, 2])).toBe('four-of-a-kind');
    expect(kindOf([3, 3, 3, 5, 5])).toBe('full-house');
    expect(kindOf([2, 3, 4, 5, 5])).toBe('small-straight');
    expect(kindOf([5, 5, 5, 1, 2])).toBe('three-of-a-kind');
    expect(kindOf([2, 2, 5, 5, 1])).toBe('two-pair');
    expect(kindOf([6, 6, 1, 3, 5])).toBe('pair');
    expect(kindOf([1, 3, 5])).toBe('high-roll');
  });

  it('prefers the stronger combo when a hand qualifies for several', () => {
    // Also contains a pair and a triple, but four of a kind outranks both.
    expect(kindOf([2, 2, 2, 2, 5])).toBe('four-of-a-kind');
    // Contains a small straight, but the full house scores higher.
    expect(kindOf([3, 3, 3, 4, 4])).toBe('full-house');
  });

  it('does not call three-of-a-kind plus its own spare a full house', () => {
    // Five identical dice must not be read as a triple + a pair of the same value.
    const combo = detectCombo([4, 4, 4, 4, 4]);
    expect(combo.kind).toBe('five-of-a-kind');
  });

  it('rejects a full house built from a single triple with no partner', () => {
    expect(kindOf([3, 3, 3, 1, 5])).toBe('three-of-a-kind');
  });

  it('picks the highest pair when two pairs are present', () => {
    const combo = detectCombo([2, 2, 6, 6, 1]);
    expect(combo.kind).toBe('two-pair');
    expect(combo.values[0]).toBe(6);
  });

  it('scores high-roll on the single largest die', () => {
    const combo = detectCombo([1, 3, 6]);
    expect(combo.values).toEqual([6]);
  });

  it('works with the two dice a run starts with', () => {
    expect(kindOf([5, 5])).toBe('pair');
    expect(kindOf([2, 6])).toBe('high-roll');
  });

  it('never throws on an empty hand', () => {
    expect(() => detectCombo([])).not.toThrow();
    expect(kindOf([])).toBe('high-roll');
  });

  it('keeps the scoring table ordered strongest-first by multiplier', () => {
    const order = [
      'five-of-a-kind',
      'large-straight',
      'four-of-a-kind',
      'full-house',
      'small-straight',
      'three-of-a-kind',
      'two-pair',
      'pair',
      'high-roll',
    ] as const;
    const mults = order.map((k) => COMBO_TABLE[k].multiplier);
    expect([...mults].sort((a, b) => b - a)).toEqual(mults);
  });
});
