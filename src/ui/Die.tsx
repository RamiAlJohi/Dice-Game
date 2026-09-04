import { motion } from 'framer-motion';

/** Pip layout per face value, as a 3x3 grid of occupied cells. */
const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface DieProps {
  value: number;
  held: boolean;
  tier: number;
  disabled?: boolean;
  onClick: () => void;
}

export function Die({ value, held, tier, disabled, onClick }: DieProps) {
  const cells = PIP_LAYOUTS[value] ?? [4];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Die showing ${value}${held ? ', held' : ''}`}
      aria-pressed={held}
      // Re-keying on value in the parent makes this animate on every reroll.
      initial={{ rotate: -18, scale: 0.8, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 18 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className={[
        'relative grid h-16 w-16 grid-cols-3 grid-rows-3 place-items-center rounded-xl p-2',
        'transition-colors duration-150 sm:h-20 sm:w-20',
        held
          ? 'bg-amber-300 text-slate-900 ring-2 ring-amber-200'
          : 'bg-slate-100 text-slate-900 ring-1 ring-slate-400/40',
        disabled ? 'cursor-default opacity-60' : 'cursor-pointer hover:brightness-105',
      ].join(' ')}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={cells.includes(i) ? 'pip' : 'h-2 w-2'} />
      ))}

      {tier > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">
          +{tier}
        </span>
      )}
      {held && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded bg-amber-300 px-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
          Held
        </span>
      )}
    </motion.button>
  );
}
