import "server-only";

// Fixed-window rate limit per key (usually the client IP).
//
// Limitation: this lives in memory. On Vercel each function instance has its own copy and loses it
// on a cold start, so a client spread over several instances can go past the limit. It still stops
// simple floods and double submits, and the honeypot and fill-time checks apply anyway. For real
// traffic, back it with a shared store such as Upstash Redis (`@upstash/ratelimit`).

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
