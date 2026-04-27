import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const STEALTHY_NOTE_ADMIN_TOKEN_NAME = process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || 'StealthyNoteAdminToken';
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'Admin@1234';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: (parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000,
  path: '/',
};

/**
 * Verify admin token without database access (safe for Edge Runtime)
 * Used in middleware.js which runs on Edge Runtime
 */
export async function verifyAdminToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STEALTHY_NOTE_ADMIN_TOKEN_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.secretKey === ADMIN_SECRET_KEY) {
      return { isAdmin: true };
    }
    return null;
  } catch (error) {
    return null;
  }
}
