/**
 * Lightweight per-process, in-memory sliding-window rate limiter for
 * sensitive endpoints (login, admin key verification, password reset codes).
 *
 * NOTE: state is per-process. On multi-instance deployments put a shared
 * store (e.g. Redis) in front of this; it still degrades gracefully here.
 */

const buckets = new Map();
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

export function getClientIp(request) {
  try {
    const forwarded = request?.headers?.get?.('x-forwarded-for') || '';
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
    return request?.headers?.get?.('x-real-ip') || 'unknown';
  } catch {
    return 'unknown';
  }
}

function cleanup(now) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > bucket.windowMs) buckets.delete(key);
  }
}

/**
 * @param {object} options
 * @param {string} options.scope   Unique limiter name, e.g. 'user-login'.
 * @param {Request} [options.request] Incoming request (used for the client IP).
 * @param {string} [options.key]   Optional explicit key (overrides IP keying).
 * @param {number} [options.limit] Max requests per window.
 * @param {number} [options.windowMs] Window length in milliseconds.
 * @returns {{limited: boolean, remaining: number, retryAfterSec: number}}
 */
export function rateLimit({ scope, request, key, limit = 10, windowMs = 15 * 60 * 1000 }) {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup(now);
    lastCleanup = now;
  }

  const bucketKey = `${scope}:${key || getClientIp(request)}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || now - bucket.start >= windowMs) {
    buckets.set(bucketKey, { start: now, windowMs, count: 1 });
    return { limited: false, remaining: limit - 1, retryAfterSec: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.start + windowMs - now) / 1000));
    return { limited: true, remaining: 0, retryAfterSec };
  }

  return { limited: false, remaining: limit - bucket.count, retryAfterSec: 0 };
}

/** Convenience helper to build a 429 response from a limiter result. */
export function rateLimitedResponse(result, NextResponse) {
  return NextResponse.json(
    { success: false, message: 'Too many attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } }
  );
}
