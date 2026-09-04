import { create } from 'zustand';
import {
  createRun,
  reroll,
  resolveRound,
  toggleHold,
  chooseUpgrade,
} from '../engine/run';
import { Rng, randomSeed } from '../engine/rng';
import type { RunState } from '../engine/types';

interface GameStore {
  run: RunState;
  /**
   * Live generator, kept outside React state on purpose: rebuilding it from
   * (seed, cursor) on every action would replay the whole run each time.
   */
  rng: Rng;
  reroll: () => void;
  hold: (dieId: string) => void;
  resolve: () => void;
  pickUpgrade: (id: string) => void;
  newRun: (seed?: string) => void;
}

const initial = createRun(randomSeed());

export const useGame = create<GameStore>((set) => ({
  run: initial.state,
  rng: initial.rng,

  reroll: () => set((s) => ({ run: reroll(s.run, s.rng) })),
  hold: (dieId) => set((s) => ({ run: toggleHold(s.run, dieId) })),
  resolve: () => set((s) => ({ run: resolveRound(s.run, s.rng) })),
  pickUpgrade: (id) => set((s) => ({ run: chooseUpgrade(s.run, id, s.rng) })),

  newRun: (seed) => {
    const started = createRun(seed ?? randomSeed());
    set({ run: started.state, rng: started.rng });
  },
}));
