import type { ComboKind, Relic, RunState, Upgrade } from './types';
import { MAX_DICE, makeDie, upgradeDie } from './dice';
import type { Rng } from './rng';
import { COMBO_LABELS } from './combos';

export const MAX_ROLLS_CAP = 5;
const UPGRADE_CHOICES = 3;

interface RelicTemplate {
  name: string;
  description: string;
  appliesTo: ComboKind[];
  bonusFlat: number;
  bonusMultiplier: number;
}

const RELIC_POOL: RelicTemplate[] = [
  {
    name: 'Whetstone',
    description: '+6 damage on every combo.',
    appliesTo: [],
    bonusFlat: 6,
    bonusMultiplier: 1,
  },
  {
    name: 'Twin Fang',
    description: 'Pairs and Two Pair deal 1.6x damage.',
    appliesTo: ['pair', 'two-pair'],
    bonusFlat: 0,
    bonusMultiplier: 1.6,
  },
  {
    name: 'Ladder Charm',
    description: 'Straights deal 1.5x damage.',
    appliesTo: ['small-straight', 'large-straight'],
    bonusFlat: 0,
    bonusMultiplier: 1.5,
  },
  {
    name: 'Triune Idol',
    description: 'Three of a Kind and Full House gain +14 damage.',
    appliesTo: ['three-of-a-kind', 'full-house'],
    bonusFlat: 14,
    bonusMultiplier: 1,
  },
  {
    name: 'Gambler’s Coin',
    description: 'High Roll deals 3x damage. For the desperate.',
    appliesTo: ['high-roll'],
    bonusFlat: 0,
    bonusMultiplier: 3,
  },
  {
    name: 'Crown of Fives',
    description: 'Four and Five of a Kind gain +25 damage.',
    appliesTo: ['four-of-a-kind', 'five-of-a-kind'],
    bonusFlat: 25,
    bonusMultiplier: 1,
  },
  {
    name: 'Iron Tally',
    description: '+1.15x damage on everything.',
    appliesTo: [],
    bonusFlat: 0,
    bonusMultiplier: 1.15,
  },
];

function relicFrom(template: RelicTemplate, id: string): Relic {
  return { id, ...template };
}

/**
 * Offers up to three upgrades. Options that would do nothing (a sixth die, a
 * duplicate relic) are filtered out before sampling, so a choice is never wasted.
 */
export function rollUpgrades(state: RunState, rng: Rng): Upgrade[] {
  const pool: Upgrade[] = [];

  if (state.dice.length < MAX_DICE) {
    pool.push({
      id: 'add-die',
      kind: 'add-die',
      name: 'Extra Die',
      description: `Add a ${state.dice.length + 1}th die to your bag.`,
    });
  }

  if (state.maxRolls < MAX_ROLLS_CAP) {
    pool.push({
      id: 'max-rolls',
      kind: 'max-rolls',
      name: 'Steady Hands',
      description: `Roll ${state.maxRolls + 1} times per round instead of ${state.maxRolls}.`,
    });
  }

  // One face-upgrade option per die, so the choice stays legible at five dice.
  const weakest = [...state.dice].sort(
    (a, b) => Math.min(...a.faces) - Math.min(...b.faces),
  )[0];
  if (weakest) {
    pool.push({
      id: `upgrade-face-${weakest.id}`,
      kind: 'upgrade-face',
      dieId: weakest.id,
      name: 'Reforge Die',
      description: `Raise the lowest face of die ${weakest.id.toUpperCase()} by 1 pip.`,
    });
  }

  pool.push({
    id: 'heal',
    kind: 'heal',
    amount: Math.round(state.maxHp * 0.35),
    name: 'Field Rations',
    description: `Restore ${Math.round(state.maxHp * 0.35)} HP.`,
  });

  const ownedNames = new Set(state.relics.map((r) => r.name));
  for (const template of RELIC_POOL) {
    if (ownedNames.has(template.name)) continue;
    pool.push({
      id: `relic-${template.name}`,
      kind: 'relic',
      relic: relicFrom(template, `relic-${template.name}-${state.stage}`),
      name: template.name,
      description: template.description,
    });
  }

  return rng.sample(pool, UPGRADE_CHOICES);
}

/** Pure: returns a new state with the upgrade applied. */
export function applyUpgrade(state: RunState, upgrade: Upgrade): RunState {
  switch (upgrade.kind) {
    case 'add-die':
      return { ...state, dice: [...state.dice, makeDie(`d${state.dice.length}`)] };

    case 'max-rolls':
      return { ...state, maxRolls: Math.min(MAX_ROLLS_CAP, state.maxRolls + 1) };

    case 'upgrade-face':
      return {
        ...state,
        dice: state.dice.map((d) => (d.id === upgrade.dieId ? upgradeDie(d) : d)),
      };

    case 'heal':
      return { ...state, hp: Math.min(state.maxHp, state.hp + upgrade.amount) };

    case 'relic':
      return { ...state, relics: [...state.relics, upgrade.relic] };
  }
}

/** Human-readable summary of a relic's reach, for tooltips. */
export function relicScope(relic: Relic): string {
  if (relic.appliesTo.length === 0) return 'All combos';
  return relic.appliesTo.map((k) => COMBO_LABELS[k]).join(', ');
}
