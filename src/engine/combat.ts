import type { Combo, DamageBreakdown, Relic } from './types';

/**
 * Damage model: (base + pips + flat relic bonuses) * (combo mult * relic mult).
 *
 * Pips are included so that a Pair of 6s beats a Pair of 2s — without that term
 * the roll-again decision collapses into "only chase combo kind", which is a
 * much less interesting choice.
 */
export function computeDamage(combo: Combo, relics: Relic[]): DamageBreakdown {
  const applicable = relics.filter(
    (r) => r.appliesTo.length === 0 || r.appliesTo.includes(combo.kind),
  );

  const relicFlat = applicable.reduce((sum, r) => sum + r.bonusFlat, 0);
  const relicMultiplier = applicable.reduce((mult, r) => mult * r.bonusMultiplier, 1);

  const pips = combo.values.reduce((sum, v) => sum + v, 0);
  const total = Math.max(
    1,
    Math.round((combo.base + pips + relicFlat) * combo.multiplier * relicMultiplier),
  );

  return { combo, relicFlat, relicMultiplier, total };
}

/** XP for clearing a stage. Front-loaded so early levels arrive quickly. */
export function xpForStage(stage: number): number {
  return 8 + stage * 4;
}

/** Rising XP wall; pairs with xpForStage to give ~one level per stage early on. */
export function xpToLevel(level: number): number {
  return Math.round(12 * Math.pow(1.35, level - 1));
}
