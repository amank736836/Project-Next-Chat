import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWT_SECRET, ADMIN_SECRET_KEY, adminCookieOptions } from '../../../../../lib/server/auth.js';
import { STEALTHY_NOTE_ADMIN_TOKEN_NAME } from '../../../../../lib/server/auth.js';
import { safeEqual } from '../../../../../lib/server/secrets.js';
import { rateLimit, rateLimitedResponse } from '../../../../../lib/server/rateLimit.js';

export async function POST(request) {
  // SECURITY: the admin key is a single shared secret — rate-limit attempts hard.
  const limitResult = rateLimit({ scope: 'admin-verify', request, limit: 5, windowMs: 15 * 60 * 1000 });
  if (limitResult.limited) {
    return rateLimitedResponse(limitResult, NextResponse);
  }

  try {
    let secretKey;
    try {
      ({ secretKey } = await request.json());
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (typeof secretKey !== 'string' || !safeEqual(secretKey, ADMIN_SECRET_KEY)) {
      return NextResponse.json(
        { success: false, message: 'Invalid secret key' },
        { status: 401 }
      );
    }

    // SECURITY: the token carries a role claim only — the admin secret key is
    // never embedded in a token payload.
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });

    const cookieStore = await cookies();
    cookieStore.set(STEALTHY_NOTE_ADMIN_TOKEN_NAME, token, {
      httpOnly: adminCookieOptions.httpOnly,
      secure: adminCookieOptions.secure,
      sameSite: adminCookieOptions.sameSite,
      maxAge: adminCookieOptions.maxAge,
      path: adminCookieOptions.path,
    });

    return NextResponse.json(
      { success: true, message: 'Admin login successful' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Admin login failed' },
      { status: 500 }
    );
  }
}
