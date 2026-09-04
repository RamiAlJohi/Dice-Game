import type { RunState } from '../engine/types';
import { relicScope } from '../engine/upgrades';
import { xpToLevel } from '../engine/combat';

export function RunSidebar({ run }: { run: RunState }) {
  const xpNeeded = xpToLevel(run.level);

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Level {run.level}
          </span>
          <span className="text-xs tabular-nums text-slate-500">
            {run.xp} / {xpNeeded} XP
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-violet-500 transition-[width] duration-500"
            style={{ width: `${Math.min(100, (run.xp / xpNeeded) * 100)}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
          Relics ({run.relics.length})
        </h3>
        {run.relics.length === 0 ? (
          <p className="text-xs text-slate-600">None yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {run.relics.map((r) => (
              <li key={r.id} className="rounded-lg bg-slate-800/70 px-2 py-1.5">
                <div className="text-xs font-semibold text-amber-300">{r.name}</div>
                <div className="text-[11px] leading-snug text-slate-400">{r.description}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                  {relicScope(r)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex-1">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Log</h3>
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto text-[11px] leading-relaxed text-slate-400">
          {run.log.map((line, i) => (
            <li key={`${i}-${line}`} className={i === 0 ? 'text-slate-200' : undefined}>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-800 pt-2 text-[10px] uppercase tracking-wide text-slate-600">
        Seed <span className="text-slate-400">{run.seed}</span>
      </div>
    </aside>
  );
}
