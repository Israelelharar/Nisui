/**
 * Deterministic daily rotation.
 *
 * Each pool is shuffled once per "cycle" (pool length in days) with a seeded
 * PRNG, then walked one item per day. Result: a new item every day, no repeats
 * until the whole pool has been shown, and the same item all day long even if
 * she reloads. Different `salt`s keep pools out of sync so the mix of the day
 * (line + photo + letter + question) is always a new combination.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The item for `dayIndex` (+ optional `step` for "עוד אחד"). */
export function pickDaily<T>(pool: readonly T[], dayIndex: number, salt: string, step = 0): T {
  if (pool.length === 0) throw new Error(`empty pool: ${salt}`);
  const n = pool.length;
  const d = dayIndex + step;
  const cycle = Math.floor(d / n);
  return shuffled(pool, hash(`${salt}:${cycle}`))[((d % n) + n) % n];
}

/** `count` distinct items for the day. */
export function pickManyDaily<T>(pool: readonly T[], dayIndex: number, salt: string, count: number): T[] {
  const order = shuffled(pool, hash(`${salt}:${dayIndex}`));
  return order.slice(0, Math.min(count, order.length));
}
