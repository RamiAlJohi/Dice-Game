/**
 * Deterministic RNG. Every random draw in a run flows through here so that a run
 * is reproducible from its seed alone — which is what makes balance simulation
 * and bug reports ("seed abc123, stage 4") possible.
 */

/** FNV-1a. Turns a human-typed seed string into a 32-bit integer. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough distribution for a dice game. */
function mulberry32(a: number): () => number {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A positioned RNG. `cursor` counts draws taken, so a run can be rebuilt exactly
 * by replaying from (seed, cursor) — no need to serialise generator internals.
 */
export class Rng {
  private gen: () => number;

  constructor(
    public readonly seed: string,
    public cursor = 0,
  ) {
    this.gen = mulberry32(hashSeed(seed));
    for (let i = 0; i < cursor; i++) this.gen();
  }

  /** Float in [0, 1). */
  next(): number {
    this.cursor++;
    return this.gen();
  }

  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty array');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Up to `count` distinct items, without mutating the input. */
  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items];
    const out: T[] = [];
    while (out.length < count && pool.length > 0) {
      out.push(pool.splice(this.int(0, pool.length - 1), 1)[0] as T);
    }
    return out;
  }
}

/** Random seed for a fresh run — short enough to read aloud or paste in a bug report. */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
