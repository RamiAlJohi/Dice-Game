import { motion } from 'framer-motion';
import type { Upgrade } from '../engine/types';

const KIND_STYLES: Record<Upgrade['kind'], { tag: string; accent: string }> = {
  'add-die': { tag: 'Dice', accent: 'border-sky-400/60 hover:bg-sky-400/10' },
  'max-rolls': { tag: 'Tempo', accent: 'border-teal-400/60 hover:bg-teal-400/10' },
  'upgrade-face': { tag: 'Forge', accent: 'border-violet-400/60 hover:bg-violet-400/10' },
  heal: { tag: 'Recover', accent: 'border-emerald-400/60 hover:bg-emerald-400/10' },
  relic: { tag: 'Relic', accent: 'border-amber-400/60 hover:bg-amber-400/10' },
};

interface UpgradePickerProps {
  upgrades: Upgrade[];
  level: number;
  onPick: (id: string) => void;
}

export function UpgradePicker({ upgrades, level, onPick }: UpgradePickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"
    >
      <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-widest text-amber-300">
        Level {level} — choose an upgrade
      </h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {upgrades.map((u, i) => {
          const style = KIND_STYLES[u.kind];
          return (
            <motion.button
              key={u.id}
              type="button"
              onClick={() => onPick(u.id)}
              data-testid="upgrade-option"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              className={`flex flex-col gap-1 rounded-xl border-2 bg-slate-800/60 p-3 text-left transition-colors ${style.accent}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {style.tag}
              </span>
              <span className="font-semibold text-slate-100">{u.name}</span>
              <span className="text-xs leading-snug text-slate-400">{u.description}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
