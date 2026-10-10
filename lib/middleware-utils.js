import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWT_SECRET, ADMIN_SECRET_KEY, safeEqual } from './server/secrets.js';

export { JWT_SECRET, ADMIN_SECRET_KEY };
export const STEALTHY_NOTE_ADMIN_TOKEN_NAME = process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || 'StealthyNoteAdminToken';

const SAME_SITE_VALUES = ['strict', 'lax', 'none'];
const configuredSameSite = (process.env.COOKIE_SAMESITE || '').toLowerCase();
const SAME_SITE = SAME_SITE_VALUES.includes(configuredSameSite) ? configuredSameSite : 'lax';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || SAME_SITE === 'none',
  sameSite: SAME_SITE,
  maxAge: (parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000,
  path: '/',
};

/**
 * Verify admin tokens without database access.
 * middleware.js uses the Node runtime for jsonwebtoken's crypto operations.
 */
export async function verifyAdminToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STEALTHY_NOTE_ADMIN_TOKEN_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Accept the role claim, or legacy tokens that embed the admin key
    // (compared in constant time).
    if (decoded.role === 'admin') {
      return { isAdmin: true };
    }
    if (typeof decoded.secretKey === 'string' && safeEqual(decoded.secretKey, ADMIN_SECRET_KEY)) {
      return { isAdmin: true };
    }
    return null;
  } catch (error) {
    return null;
  }
}
