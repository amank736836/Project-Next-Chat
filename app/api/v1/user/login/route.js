import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { sendToken } from '../../../../../lib/server/auth.js';
import { rateLimit, rateLimitedResponse } from '../../../../../lib/server/rateLimit.js';

export async function POST(request) {
  // SECURITY: limit credential brute-forcing.
  const limitResult = rateLimit({ scope: 'user-login', request, limit: 10, windowMs: 15 * 60 * 1000 });
  if (limitResult.limited) {
    return rateLimitedResponse(limitResult, NextResponse);
  }

  try {
    await connectDB();

    let identifier;
    let password;
    try {
      ({ identifier, password } = await request.json());
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user) {
      // SECURITY: same message as a wrong password so responses do not
      // reveal whether an identifier is registered.
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your account' },
        { status: 401 }
      );
    }

    const loggedInUser = await sendToken(user._id);

    return NextResponse.json(
      { success: true, message: 'Login successful', user: loggedInUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    // SECURITY: never echo internal error details to the client.
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
