import type { Combo, ComboKind } from './types';

interface ComboDef {
  kind: ComboKind;
  base: number;
  multiplier: number;
}

/**
 * Scoring table, richest first. `detectCombo` returns the first entry that
 * matches, so order here *is* the precedence rule — keep it sorted by strength.
 */
export const COMBO_TABLE: Record<ComboKind, ComboDef> = {
  'five-of-a-kind': { kind: 'five-of-a-kind', base: 60, multiplier: 3.0 },
  'large-straight': { kind: 'large-straight', base: 45, multiplier: 2.5 },
  'four-of-a-kind': { kind: 'four-of-a-kind', base: 40, multiplier: 2.2 },
  'full-house': { kind: 'full-house', base: 30, multiplier: 2.0 },
  'small-straight': { kind: 'small-straight', base: 25, multiplier: 1.8 },
  'three-of-a-kind': { kind: 'three-of-a-kind', base: 20, multiplier: 1.5 },
  'two-pair': { kind: 'two-pair', base: 14, multiplier: 1.3 },
  pair: { kind: 'pair', base: 8, multiplier: 1.15 },
  'high-roll': { kind: 'high-roll', base: 0, multiplier: 1.0 },
};

export const COMBO_LABELS: Record<ComboKind, string> = {
  'five-of-a-kind': 'Five of a Kind',
  'large-straight': 'Large Straight',
  'four-of-a-kind': 'Four of a Kind',
  'full-house': 'Full House',
  'small-straight': 'Small Straight',
  'three-of-a-kind': 'Three of a Kind',
  'two-pair': 'Two Pair',
  pair: 'Pair',
  'high-roll': 'High Roll',
};

/** Map of face value -> how many dice show it. */
function tally(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

/** All face values appearing at least `n` times, largest value first. */
function valuesWithCount(counts: Map<number, number>, n: number): number[] {
  return [...counts.entries()]
    .filter(([, c]) => c >= n)
    .map(([v]) => v)
    .sort((a, b) => b - a);
}

/** Longest run of consecutive distinct values, e.g. [2,3,4,6] -> [2,3,4]. */
export function longestStraight(values: number[]): number[] {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  let best: number[] = [];
  let current: number[] = [];
  for (const v of unique) {
    const last = current[current.length - 1];
    if (last !== undefined && v !== last + 1) current = [];
    current.push(v);
    if (current.length > best.length) best = [...current];
  }
  return best;
}

function make(def: ComboDef, values: number[]): Combo {
  return { kind: def.kind, values, base: def.base, multiplier: def.multiplier };
}

/**
 * Best combo in a set of rolled values. Always returns something: a hand that
 * matches nothing scores as `high-roll` on its single largest die, so a bad roll
 * still chips at the enemy rather than wasting the round entirely.
 */
export function detectCombo(values: number[]): Combo {
  if (values.length === 0) {
    return make(COMBO_TABLE['high-roll'], []);
  }

  const counts = tally(values);
  const fives = valuesWithCount(counts, 5);
  const fours = valuesWithCount(counts, 4);
  const triples = valuesWithCount(counts, 3);
  const pairs = valuesWithCount(counts, 2);
  const straight = longestStraight(values);

  const firstFive = fives[0];
  if (firstFive !== undefined) {
    return make(COMBO_TABLE['five-of-a-kind'], Array(5).fill(firstFive));
  }

  if (straight.length >= 5) {
    return make(COMBO_TABLE['large-straight'], straight.slice(0, 5));
  }

  const firstFour = fours[0];
  if (firstFour !== undefined) {
    return make(COMBO_TABLE['four-of-a-kind'], Array(4).fill(firstFour));
  }

  // Full house needs a triple plus a *different* value showing twice.
  const triple = triples[0];
  if (triple !== undefined) {
    const partner = pairs.find((v) => v !== triple);
    if (partner !== undefined) {
      return make(COMBO_TABLE['full-house'], [triple, triple, triple, partner, partner]);
    }
  }

  if (straight.length === 4) {
    return make(COMBO_TABLE['small-straight'], straight);
  }

  if (triple !== undefined) {
    return make(COMBO_TABLE['three-of-a-kind'], [triple, triple, triple]);
  }

  const [highPair, lowPair] = pairs;
  if (highPair !== undefined && lowPair !== undefined) {
    return make(COMBO_TABLE['two-pair'], [highPair, highPair, lowPair, lowPair]);
  }

  if (highPair !== undefined) {
    return make(COMBO_TABLE.pair, [highPair, highPair]);
  }

  return make(COMBO_TABLE['high-roll'], [Math.max(...values)]);
}
