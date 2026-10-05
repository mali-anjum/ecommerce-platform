/**
 * Deterministic PRNG (mulberry32). Decorative layouts use it instead of Math.random()
 * so server and client renders match (no hydration mismatch) and re-renders are stable.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Precomputes `count` rows of `fields` values in [0, 1). Call at module scope, not during render. */
export function seededRandomRows(count: number, fields: number, seed: number): number[][] {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => Array.from({ length: fields }, random));
}
