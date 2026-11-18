const encoder = new TextEncoder();

/*
 * A deterministic 32-bit key for `id` under `seed` (FNV-1a over "seed:id");
 * random order is a sort on it. The engine computes the same key
 * (`piximi_engine.store.random_key`), so every backend shuffles alike.
 */
export const randomKey = (seed: number, id: string): number => {
  let key = 0x811c9dc5;
  for (const byte of encoder.encode(`${seed}:${id}`)) {
    key = Math.imul(key ^ byte, 0x01000193);
  }
  return key >>> 0;
};
