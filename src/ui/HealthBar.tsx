import { motion } from 'framer-motion';

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  tone: 'player' | 'enemy';
}

export function HealthBar({ current, max, label, tone }: HealthBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const fill = tone === 'player' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          {current} / {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
      >
        <motion.div
          className={`h-full ${fill}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        />
      </div>
    </div>
  );
}
