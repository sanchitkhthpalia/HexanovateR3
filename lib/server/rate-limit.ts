import "server-only";

// Fixed-window rate limit per key (client IP): at most LIMIT requests per WINDOW_MS.
//
// LIMITATION — in-memory state on serverless: Vercel runs this route on however many function
// instances it needs, each with its own memory, and instances are recycled. So the limit is
// per-instance and resets on cold starts; a determined client spread across instances gets more
// than LIMIT. It still stops naive floods and accidental double-submits, and the honeypot and the
// minimum-fill-time check apply regardless. For a real deployment, back this with a shared store
// (e.g. Upstash Redis via the Vercel Marketplace, `@upstash/ratelimit`) — same interface.

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_KEYS = 10_000; // bound memory if many IPs hit one instance

const hits = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (for Retry-After). */
  retryAfter: number;
}

export function rateLimit(key: string, now = Date.now(), limit = LIMIT): RateLimitResult {
  let entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_KEYS) prune(now);
    entry = { count: 0, resetAt: now + WINDOW_MS };
    hits.set(key, entry);
  }
  entry.count++;
  return { allowed: entry.count <= limit, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
}

function prune(now: number) {
  for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  if (hits.size >= MAX_KEYS) hits.clear();
}

/** For tests. */
export function resetRateLimit() {
  hits.clear();
}
