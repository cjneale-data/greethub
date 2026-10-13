/** Tiny in-memory sliding-window limiter. TODO: per-user limits in Supabase/Redis for multi-instance deploys (SEC-07). */
const buckets = new Map<string, number[]>();

/** Memory guard: rotating or spoofed keys must not grow the map without bound. Past this size, idle keys are swept. */
const MAX_KEYS = 10_000;
const IDLE_MS = 60 * 60_000;

function sweep(now: number) {
  for (const [k, hits] of buckets) if (!hits.length || now - hits[hits.length - 1] > IDLE_MS) buckets.delete(k);
  // Still full (a flood of fresh keys): drop the oldest-inserted half rather than grow.
  if (buckets.size >= MAX_KEYS) {
    let n = Math.floor(buckets.size / 2);
    for (const k of buckets.keys()) {
      if (n-- <= 0) break;
      buckets.delete(k);
    }
  }
}

export function allow(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) sweep(now);
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Test hook. */
export const bucketCount = () => buckets.size;
