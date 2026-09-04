import type { Enemy } from './types';
import type { Rng } from './rng';

interface EnemyTemplate {
  name: string;
  hpFactor: number;
  damageFactor: number;
  cadence: number;
}

const TEMPLATES: EnemyTemplate[] = [
  { name: 'Slime', hpFactor: 0.85, damageFactor: 0.8, cadence: 1 },
  { name: 'Bandit', hpFactor: 1.0, damageFactor: 1.0, cadence: 1 },
  { name: 'Stone Golem', hpFactor: 1.5, damageFactor: 1.4, cadence: 2 },
  { name: 'Wisp', hpFactor: 0.7, damageFactor: 1.3, cadence: 1 },
  { name: 'Warden', hpFactor: 1.25, damageFactor: 1.1, cadence: 1 },
];

const BOSS: EnemyTemplate = { name: 'Dice Tyrant', hpFactor: 2.4, damageFactor: 1.6, cadence: 1 };

export const BOSS_STAGE = 10;

/**
 * Enemy stats scale super-linearly with stage while player damage scales with
 * dice count and relics — the crossover is what the balance sim exists to check.
 */
export function makeEnemy(stage: number, rng: Rng): Enemy {
  const isBoss = stage >= BOSS_STAGE;
  const template = isBoss ? BOSS : rng.pick(TEMPLATES);
  const curve = 1 + (stage - 1) * 0.44;
  const maxHp = Math.round(30 * curve * template.hpFactor);
  return {
    id: `stage-${stage}`,
    name: template.name,
    maxHp,
    hp: maxHp,
    damage: Math.round((3 + stage * 1.0) * template.damageFactor),
    cadence: template.cadence,
  };
}
