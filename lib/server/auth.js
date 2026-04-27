import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from './db.js';
import User from './models/user.model.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_COOKIE_EXPIRES_IN = parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
export const STEALTHY_NOTE_TOKEN_NAME = process.env.STEALTHY_NOTE_TOKEN_NAME || 'StealthyNoteToken';
export const STEALTHY_NOTE_ADMIN_TOKEN_NAME = process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || 'StealthyNoteAdminToken';
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'Admin@1234';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  path: '/',
};

const getUserIdFromToken = (decoded) => decoded?.id || decoded?._id;

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
    if (decoded.secretKey === ADMIN_SECRET_KEY) {
      return { isAdmin: true };
    }
    return null;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Clear expired token
      cookieStore.set(STEALTHY_NOTE_ADMIN_TOKEN_NAME, '', {
        ...cookieOptions,
        maxAge: 0
      });
    }
    return null;
  }
}


