/**
 * Core domain types. This module — and everything else under engine/ — must stay
 * free of React, DOM and I/O so a full run can be simulated headlessly.
 */

/** A die is six faces of pips. Faces are mutable across a run via upgrades. */
export interface Die {
  id: string;
  faces: number[];
  /** Cosmetic tier, driven by how many times the die has been upgraded. */
  tier: number;
}

export interface RolledDie {
  dieId: string;
  value: number;
  held: boolean;
}

export type ComboKind =
  | 'five-of-a-kind'
  | 'four-of-a-kind'
  | 'large-straight'
  | 'full-house'
  | 'small-straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-roll';

export interface Combo {
  kind: ComboKind;
  /** Die values that formed the combo. */
  values: number[];
  base: number;
  multiplier: number;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  /** Combo kinds this relic amplifies; empty means it applies to every combo. */
  appliesTo: ComboKind[];
  bonusFlat: number;
  bonusMultiplier: number;
}

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  damage: number;
  /** Rounds between attacks; 1 means it strikes every round. */
  cadence: number;
}

export interface DamageBreakdown {
  combo: Combo;
  relicFlat: number;
  relicMultiplier: number;
  total: number;
}

export type RunPhase = 'rolling' | 'choosing-upgrade' | 'won' | 'lost';

interface UpgradeBase {
  id: string;
  name: string;
  description: string;
}

/** Discriminated so `applyUpgrade` can exhaustively switch without casts. */
export type Upgrade =
  | (UpgradeBase & { kind: 'add-die' })
  | (UpgradeBase & { kind: 'upgrade-face'; dieId: string })
  | (UpgradeBase & { kind: 'relic'; relic: Relic })
  | (UpgradeBase & { kind: 'heal'; amount: number })
  | (UpgradeBase & { kind: 'max-rolls' });

export interface RunState {
  seed: string;
  /** RNG cursor. Persisting this makes a run fully reproducible from (seed, cursor). */
  rngCursor: number;
  phase: RunPhase;
  dice: Die[];
  roll: RolledDie[];
  rollsUsed: number;
  maxRolls: number;
  relics: Relic[];
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  stage: number;
  /** Rounds fought against the current enemy; drives attack cadence. */
  roundsThisStage: number;
  enemy: Enemy;
  offeredUpgrades: Upgrade[];
  /** Newest-first log of what just happened, for the UI ticker. */
  log: string[];
}
