/**
 * Seeded 32-bit PRNG. Returns a function that yields deterministic floats in
 * `[0, 1)` on each call — same seed produces the same sequence. Used to drive
 * `seededShuffle` and `seededRandom`, but can be passed to any algorithm expecting a `Math.random`-
 * shaped function.
 * @see https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
export const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Uses the `mulberry32` seeded rng to create a deterministic ranged rng
 * @param seed
 * @returns scaled down version of lodash's `random` function @see https://lodash.com/docs/4.18.1#random
 */
export const makeSeededRandom = (seed: number) => {
  const rng = mulberry32(seed);
  return (lower: number, upper: number, floating?: boolean) => {
    floating = !!floating;
    if (!floating) if (lower % 1 > 0 || upper % 1 > 0) floating = true;
    const rangedRn = floating
      ? rng() * (upper - lower)
      : Math.floor(rng() * (upper - lower + 1));
    return lower + rangedRn;
  };
};
