/**
 * Per-process burst protection for AI requests.
 *
 * This is deliberately simple: the authoritative limit is the count of recent
 * `ai_generations` rows in the database (which survives restarts and multiple
 * instances). This map catches bursts inside one process before they reach
 * the provider or the database.
 */

const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function consumeLocalRateLimit(
  key: string,
  limit: number,
  now = Date.now(),
): RateLimitResult {
  const cutoff = now - WINDOW_MS;
  const hits = (buckets.get(key) ?? []).filter((stamp) => stamp > cutoff);

  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    buckets.set(key, hits);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((oldest + WINDOW_MS - now) / 1000),
      ),
    };
  }

  hits.push(now);

  // Keep the map from growing without bound in a long-lived process.
  if (buckets.size > 5_000) {
    for (const [storedKey, stamps] of buckets) {
      if (stamps.every((stamp) => stamp <= cutoff)) {
        buckets.delete(storedKey);
      }
    }
  }

  buckets.set(key, hits);

  return {
    allowed: true,
    remaining: Math.max(0, limit - hits.length),
    retryAfterSeconds: 0,
  };
}
