import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from './db.js';
import User from './models/user.model.js';
import { JWT_SECRET, ADMIN_SECRET_KEY, safeEqual } from './secrets.js';

export { JWT_SECRET, ADMIN_SECRET_KEY };

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_COOKIE_EXPIRES_IN = parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
export const STEALTHY_NOTE_TOKEN_NAME = process.env.STEALTHY_NOTE_TOKEN_NAME || 'StealthyNoteToken';
export const STEALTHY_NOTE_ADMIN_TOKEN_NAME = process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || 'StealthyNoteAdminToken';

/**
 * Cookie SameSite policy.
 * SECURITY: default is 'lax' so the session cookie is not sent on
 * cross-site requests (CSRF protection). Set COOKIE_SAMESITE=none only if a
 * cross-origin flow explicitly requires it; 'none' always forces Secure.
 */
const SAME_SITE_VALUES = ['strict', 'lax', 'none'];
const configuredSameSite = (process.env.COOKIE_SAMESITE || '').toLowerCase();
const SAME_SITE = SAME_SITE_VALUES.includes(configuredSameSite) ? configuredSameSite : 'lax';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || SAME_SITE === 'none',
  sameSite: SAME_SITE,
  maxAge: JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  path: '/',
};

/** Admin sessions use short-lived tokens (matching the 12h JWT expiry). */
export const adminCookieOptions = {
  ...cookieOptions,
  maxAge: 12 * 60 * 60 * 1000,
};

const getUserIdFromToken = (decoded) => decoded?.id || decoded?._id;

/**
 * An admin token is valid when it carries the role claim, or (legacy tokens
 * issued before the role claim existed) when it embeds the admin key, which
 * is compared in constant time.
 */
export function isAdminClaim(decoded) {
  if (!decoded) return false;
  if (decoded.role === 'admin') return true;
  return typeof decoded.secretKey === 'string' && safeEqual(decoded.secretKey, ADMIN_SECRET_KEY);
}

const getCookieValueFromHeader = (cookieHeader, cookieName) => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookiePair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  if (!cookiePair) {
    return undefined;
  }

  return cookiePair.slice(cookieName.length + 1);
};

export async function sendToken(userId, res) {
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  const cookieStore = await cookies();
  cookieStore.set(STEALTHY_NOTE_TOKEN_NAME, token, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge,
    path: cookieOptions.path,
  });

  await connectDB();
  const user = await User.findById(userId).select('-password');

  return user;
}

export async function getAuthenticatedUser(req) {
  const tokenFromHeader = getCookieValueFromHeader(
    req?.headers?.get?.("cookie"),
    STEALTHY_NOTE_TOKEN_NAME
  );

  const cookieStore = await cookies();
  const token = tokenFromHeader || cookieStore.get(STEALTHY_NOTE_TOKEN_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = getUserIdFromToken(decoded);

    if (!userId) {
      return null;
    }

    const user = await User.findById(userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STEALTHY_NOTE_ADMIN_TOKEN_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (isAdminClaim(decoded)) {
      return { isAdmin: true };
    }
    return null;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Clear expired token
      cookieStore.set(STEALTHY_NOTE_ADMIN_TOKEN_NAME, '', {
        ...adminCookieOptions,
        maxAge: 0
      });
    }
    return null;
  }
}
