/**
 * Headless balance harness. Plays thousands of runs with a simple bot policy and
 * reports win rate, where runs die, and which relics correlate with winning.
 *
 * Run with: npm run sim -- [runs]
 */
import { createRun, reroll, resolveRound, toggleHold, chooseUpgrade } from '../engine/run';
import { detectCombo } from '../engine/combos';
import { computeDamage } from '../engine/combat';
import { BOSS_STAGE } from '../engine/enemies';
import type { RunState } from '../engine/types';
import type { Rng } from '../engine/rng';

/**
 * Bot policy: hold the dice that already contribute to the best combo on the
 * table, reroll the rest. Crude, but it approximates a competent human and gives
 * a stable baseline to compare balance changes against.
 */
function chooseHolds(state: RunState, rng: Rng): RunState {
  const combo = detectCombo(state.roll.map((r) => r.value));
  const wanted = [...combo.values];
  let next = state;

  for (const rolled of state.roll) {
    const idx = wanted.indexOf(rolled.value);
    const shouldHold = idx !== -1;
    if (shouldHold) wanted.splice(idx, 1);
    if (shouldHold !== rolled.held) next = toggleHold(next, rolled.dieId);
  }
  return reroll(next, rng);
}

/** Greedy upgrade pick: whatever most raises expected damage, ties to survivability. */
function pickUpgrade(state: RunState): string {
  const scored = state.offeredUpgrades.map((u) => {
    let score: number;
    switch (u.kind) {
      case 'add-die':
        score = 100;
        break;
      case 'relic': {
        const sample = detectCombo([5, 5, 3]);
        score = 40 + computeDamage(sample, [...state.relics, u.relic]).total;
        break;
      }
      case 'max-rolls':
        score = 60;
        break;
      case 'upgrade-face':
        score = 30;
        break;
      case 'heal':
        // Only valuable when actually hurt.
        score = state.hp < state.maxHp * 0.5 ? 70 : 5;
        break;
    }
    return { id: u.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? state.offeredUpgrades[0]!.id;
}

interface RunResult {
  won: boolean;
  stageReached: number;
  relics: string[];
}

function simulateRun(seed: string): RunResult {
  const { state, rng } = createRun(seed);
  let s = state;

  for (let guard = 0; guard < 5000; guard++) {
    if (s.phase === 'won' || s.phase === 'lost') break;

    if (s.phase === 'choosing-upgrade') {
      s = chooseUpgrade(s, pickUpgrade(s), rng);
      continue;
    }

    // Spend the reroll budget chasing a better hand, then commit.
    while (s.rollsUsed < s.maxRolls) {
      const before = s.rollsUsed;
      s = chooseHolds(s, rng);
      if (s.rollsUsed === before) break;
    }
    s = resolveRound(s, rng);
  }

  return {
    won: s.phase === 'won',
    stageReached: s.stage,
    relics: s.relics.map((r) => r.name),
  };
}

function main() {
  const runs = Number(process.argv[2] ?? 10000);
  const results: RunResult[] = [];
  const started = Date.now();

  for (let i = 0; i < runs; i++) results.push(simulateRun(`sim-${i}`));

  const wins = results.filter((r) => r.won).length;
  const winRate = (wins / runs) * 100;

  console.log(`\n  ${runs} runs in ${Date.now() - started}ms`);
  console.log(`  Win rate: ${winRate.toFixed(1)}%  (${wins}/${runs})\n`);

  console.log('  Where runs end:');
  for (let stage = 1; stage <= BOSS_STAGE; stage++) {
    const deaths = results.filter((r) => !r.won && r.stageReached === stage).length;
    const pct = (deaths / runs) * 100;
    const bar = '#'.repeat(Math.round(pct));
    console.log(`    stage ${String(stage).padStart(2)}  ${pct.toFixed(1).padStart(5)}%  ${bar}`);
  }

  console.log('\n  Win rate when the run picked up a relic:');
  const relicNames = [...new Set(results.flatMap((r) => r.relics))].sort();
  const rows = relicNames.map((name) => {
    const withRelic = results.filter((r) => r.relics.includes(name));
    return { name, n: withRelic.length, rate: (withRelic.filter((r) => r.won).length / withRelic.length) * 100 };
  });
  rows.sort((a, b) => b.rate - a.rate);
  for (const row of rows) {
    console.log(`    ${row.name.padEnd(18)} ${row.rate.toFixed(1).padStart(5)}%  (n=${row.n})`);
  }
  console.log();
}

main();
