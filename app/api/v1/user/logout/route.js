import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { cookies } from 'next/headers';
import { STEALTHY_NOTE_TOKEN_NAME, cookieOptions } from '../../../../../lib/server/auth.js';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(STEALTHY_NOTE_TOKEN_NAME);
    
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
