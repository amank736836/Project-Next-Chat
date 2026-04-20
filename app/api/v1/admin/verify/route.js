import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWT_SECRET, ADMIN_SECRET_KEY, STEALTHY_NOTE_ADMIN_TOKEN_NAME, cookieOptions } from '../../../../../lib/server/auth.js';

export async function POST(request) {
  try {
    const { secretKey } = await request.json();

    if (secretKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Invalid secret key' },
        { status: 401 }
      );
    }

    const token = jwt.sign({ secretKey }, JWT_SECRET, { expiresIn: '12h' });
    
    const cookieStore = await cookies();
    cookieStore.set(STEALTHY_NOTE_ADMIN_TOKEN_NAME, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
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
