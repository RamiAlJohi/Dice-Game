import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from './state/store';
import { Die } from './ui/Die';
import { HealthBar } from './ui/HealthBar';
import { UpgradePicker } from './ui/UpgradePicker';
import { RunSidebar } from './ui/RunSidebar';
import { detectCombo, COMBO_LABELS } from './engine/combos';
import { computeDamage } from './engine/combat';
import { BOSS_STAGE } from './engine/enemies';

export default function App() {
  const { run, reroll, hold, resolve, pickUpgrade, newRun } = useGame();

  const isRolling = run.phase === 'rolling';
  const isOver = run.phase === 'won' || run.phase === 'lost';
  const rollsLeft = run.maxRolls - run.rollsUsed;

  // Live preview of what the current dice would do — the whole decision hinges
  // on this number, so it should never be something the player has to compute.
  const combo = detectCombo(run.roll.map((r) => r.value));
  const preview = computeDamage(combo, run.relics);

  const dieTier = (dieId: string) => run.dice.find((d) => d.id === dieId)?.tier ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 p-4 text-slate-100 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">Dice Roguelite</h1>
          <p className="text-xs text-slate-500">
            Stage {run.stage} of {BOSS_STAGE}
            {run.stage >= BOSS_STAGE && ' — Boss'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => newRun()}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
        >
          New Run
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <section className="flex flex-col gap-4">
          {/* Enemy */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-semibold">{run.enemy.name}</h2>
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                Hits for {run.enemy.damage}
                {run.enemy.cadence > 1 && ` every ${run.enemy.cadence} rounds`}
              </span>
            </div>
            <HealthBar current={run.enemy.hp} max={run.enemy.maxHp} label="Enemy" tone="enemy" />
          </div>

          {/* Dice tray */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div
              className={`mb-4 flex min-h-[6rem] flex-wrap items-center justify-center gap-3 transition-opacity sm:gap-4 ${
                isRolling ? '' : 'opacity-40'
              }`}
            >
              {run.roll.map((rolled) => (
                <Die
                  // Keying on the value restarts the entrance animation each reroll.
                  key={`${rolled.dieId}-${rolled.value}-${rolled.held}`}
                  value={rolled.value}
                  held={rolled.held}
                  tier={dieTier(rolled.dieId)}
                  disabled={!isRolling}
                  onClick={() => hold(rolled.dieId)}
                />
              ))}
            </div>

            <div className="mb-3 text-center">
              {isRolling ? (
                <>
                  <div className="text-sm font-semibold text-amber-300">
                    {COMBO_LABELS[combo.kind]}
                  </div>
                  <div className="text-xs text-slate-400">
                    would deal{' '}
                    <span className="font-bold text-slate-100">{preview.total}</span> damage
                  </div>
                </>
              ) : (
                // Between rounds the dice above are the spent roll, so showing a live
                // damage preview for them would be a lie. Say what is happening instead.
                <div className="text-sm font-semibold text-slate-500">
                  {run.phase === 'choosing-upgrade' ? 'Stage cleared' : 'Run over'}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={reroll}
                disabled={!isRolling || rollsLeft <= 0}
                className="flex-1 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reroll {rollsLeft > 0 ? `(${rollsLeft} left)` : '(none left)'}
              </button>
              <button
                type="button"
                onClick={resolve}
                disabled={!isRolling}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Attack
              </button>
            </div>
            {isRolling && (
              <p className="mt-2 text-center text-[11px] text-slate-600">
                Tap a die to hold it through the next reroll.
              </p>
            )}
          </div>

          {/* Player */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <HealthBar current={run.hp} max={run.maxHp} label="You" tone="player" />
          </div>

          <AnimatePresence>
            {run.phase === 'choosing-upgrade' && (
              <UpgradePicker
                upgrades={run.offeredUpgrades}
                level={run.level}
                onPick={pickUpgrade}
              />
            )}
          </AnimatePresence>

          {isOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl border p-6 text-center ${
                run.phase === 'won'
                  ? 'border-amber-400/60 bg-amber-400/10'
                  : 'border-rose-500/60 bg-rose-500/10'
              }`}
            >
              <h2 className="text-2xl font-bold">
                {run.phase === 'won' ? 'Victory' : 'Run Over'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {run.phase === 'won'
                  ? 'The Dice Tyrant falls.'
                  : `You fell on stage ${run.stage} at level ${run.level}.`}
              </p>
              <button
                type="button"
                onClick={() => newRun()}
                className="mt-4 rounded-xl bg-slate-100 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white"
              >
                New Run
              </button>
            </motion.div>
          )}
        </section>

        <RunSidebar run={run} />
      </div>
    </main>
  );
}
