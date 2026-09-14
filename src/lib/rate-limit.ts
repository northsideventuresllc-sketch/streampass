/**
 * Minimal in-memory per-key rate limiter (fixed-window counter).
 *
 * This repo has no shared store (Redis/Upstash) wired up, so this is
 * best-effort: each warm serverless instance has its own memory, meaning the
 * limit is enforced per instance, not globally across every concurrent
 * deployment/edge location. That's an acceptable tradeoff for slowing down
 * casual abuse (enumeration scripts, quota-burning loops) without adding a
 * new external dependency — swap for a shared store if stronger guarantees
 * are needed later.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Cheap bound so this Map can't grow without limit across a long-lived warm
// instance — once it's large, sweep out anything already expired.
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the caller may retry. 0 when `allowed` is true. */
  retryAfterMs: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

/** Best-effort client IP extraction for rate-limit keying (not for auth decisions). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
