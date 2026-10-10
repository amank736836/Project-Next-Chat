import crypto from 'crypto';

/**
 * Cryptographically secure verification codes.
 *
 * SECURITY: codes must never be generated with Math.random() — its output is
 * predictable, which would let an attacker precompute likely codes.
 */

export const VERIFY_CODE_LENGTH = 6;
export const MAX_CODE_ATTEMPTS = 5;
export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function generateVerificationCode() {
  const max = 10 ** VERIFY_CODE_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(VERIFY_CODE_LENGTH, '0');
}

/**
 * Validate a submitted code against the stored one.
 * Both must be present non-empty strings; comparison is constant-time.
 */
export function isValidCode(storedCode, submittedCode) {
  if (typeof storedCode !== 'string' || !storedCode) return false;
  if (typeof submittedCode !== 'string' || !submittedCode.trim()) return false;
  return safeEqualCode(storedCode, submittedCode.trim());
}

function safeEqualCode(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Clear the code + attempt counter after success or invalidation.
 */
export function clearVerificationState(user) {
  user.verifyCode = undefined;
  user.verifyCodeExpiry = undefined;
  user.verifyCodeAttempts = 0;
}
