import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from '../rng';

describe('Rng', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = new Rng('seed-one');
    const b = new Rng('seed-one');
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 20 }, (_, i) => new Rng('alpha').int(1, 6) + i);
    const b = Array.from({ length: 20 }, (_, i) => new Rng('beta').int(1, 6) + i);
    expect(a).not.toEqual(b);
  });

  it('resumes from a cursor exactly where it left off', () => {
    const a = new Rng('resume');
    for (let i = 0; i < 17; i++) a.next();
    const resumed = new Rng('resume', 17);
    expect(resumed.next()).toBe(a.next());
  });

  it('keeps int() within the inclusive bounds', () => {
    const rng = new Rng('bounds');
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it('rolls a roughly uniform d6', () => {
    const rng = new Rng('uniform');
    const counts = new Map<number, number>();
    const n = 60000;
    for (let i = 0; i < n; i++) {
      const face = rng.int(1, 6);
      counts.set(face, (counts.get(face) ?? 0) + 1);
    }
    for (let face = 1; face <= 6; face++) {
      // Expect n/6 = 10000; allow a generous 5% band so this never flakes.
      const hits = counts.get(face) ?? 0;
      expect(hits).toBeGreaterThan((n / 6) * 0.95);
      expect(hits).toBeLessThan((n / 6) * 1.05);
    }
  });

  it('sample() returns distinct items and never exceeds the pool', () => {
    const rng = new Rng('sample');
    const pool = ['a', 'b', 'c'];
    const picked = rng.sample(pool, 5);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('hashes seeds to stable 32-bit values', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
  });
});
