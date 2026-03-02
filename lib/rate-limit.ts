/**
 * In-process rate limiter (per IP)
 * For production at scale, swap to Redis-backed solution
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > windowMs * 2) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  ip: string,
  prefix = 'default'
): RateLimitResult {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');
  const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '30');
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);

  return {
    allowed: entry.count <= max,
    remaining,
    resetAt: entry.windowStart + windowMs,
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
