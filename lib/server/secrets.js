import crypto from 'crypto';

/**
 * Central, fail-safe resolution for authentication secrets.
 *
 * SECURITY: this module must never ship a guessable production secret.
 * - If the environment provides the secret, it is used as-is.
 * - In `development`/`test` (local dev server, vitest, playwright) a clearly
 *   labelled, deterministic dev secret is used so local flows stay stable,
 *   and a warning is logged. Next.js forces NODE_ENV=production for
 *   `next build`/`next start`, so these values can never be active in a
 *   production deployment.
 * - In production without the env var, a random per-process secret is
 *   generated. Sessions then fail closed (tokens cannot be forged) instead of
 *   silently relying on a hardcoded value an attacker could know.
 */

export const DEV_ONLY_JWT_SECRET = 'insecure-dev-only-jwt-secret-do-not-use-in-production';
export const DEV_ONLY_ADMIN_SECRET_KEY = 'insecure-dev-only-admin-key-do-not-use-in-production';

const warned = new Set();

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function isNonProductionEnv() {
  const env = process.env.NODE_ENV;
  return env === 'development' || env === 'test' || env === undefined;
}

function resolveSecret(envName, devOnlyFallback) {
  const fromEnv = process.env[envName];
  if (fromEnv) return fromEnv;

  if (isNonProductionEnv()) {
    warnOnce(
      envName,
      `[security] ${envName} is not set — using a clearly-labelled development fallback. ` +
        `Set ${envName} in the environment before deploying.`
    );
    return devOnlyFallback;
  }

  warnOnce(
    envName,
    `[security] ${envName} is not set in production — a random per-process value is being used, ` +
      `so tokens/sessions will not survive restarts and cannot be forged. Set ${envName} explicitly.`
  );
  return crypto.randomBytes(32).toString('hex');
}

export const JWT_SECRET = resolveSecret('JWT_SECRET', DEV_ONLY_JWT_SECRET);
export const ADMIN_SECRET_KEY = resolveSecret('ADMIN_SECRET_KEY', DEV_ONLY_ADMIN_SECRET_KEY);

/**
 * Constant-time string comparison to avoid timing side channels when
 * comparing secrets (admin key, verification codes, ...).
 */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
