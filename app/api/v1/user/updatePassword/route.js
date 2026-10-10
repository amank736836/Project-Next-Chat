import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { sendToken } from '../../../../../lib/server/auth.js';
import { rateLimit, rateLimitedResponse } from '../../../../../lib/server/rateLimit.js';
import { isValidCode, clearVerificationState, MAX_CODE_ATTEMPTS } from '../../../../../lib/server/verification.js';

export async function POST(request) {
  // SECURITY: limit brute-force attempts against the reset code.
  const limitResult = rateLimit({ scope: 'user-update-password', request, limit: 10, windowMs: 15 * 60 * 1000 });
  if (limitResult.limited) {
    return rateLimitedResponse(limitResult, NextResponse);
  }

  try {
    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { identifier, password, verifyCode } = body || {};

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Identifier is required' },
        { status: 400 }
      );
    }

    // SECURITY: both the code and the new password must be present — an
    // absent code must never match an absent stored code.
    if (typeof verifyCode !== 'string' || !verifyCode.trim()) {
      return NextResponse.json(
        { success: false, message: 'A verification code is required' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.verifyCode || !user.verifyCodeExpiry) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    if (new Date(user.verifyCodeExpiry) < new Date()) {
      clearVerificationState(user);
      await user.save();
      return NextResponse.json(
        { success: false, message: 'Verification code expired' },
        { status: 400 }
      );
    }

    if ((user.verifyCodeAttempts || 0) >= MAX_CODE_ATTEMPTS) {
      clearVerificationState(user);
      await user.save();
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    if (!isValidCode(user.verifyCode, verifyCode)) {
      user.verifyCodeAttempts = (user.verifyCodeAttempts || 0) + 1;
      const exhausted = user.verifyCodeAttempts >= MAX_CODE_ATTEMPTS;
      if (exhausted) {
        clearVerificationState(user);
      }
      await user.save();
      return NextResponse.json(
        {
          success: false,
          message: exhausted
            ? 'Too many attempts. Please request a new code.'
            : 'Invalid verification code',
        },
        { status: 400 }
      );
    }

    user.password = password;
    clearVerificationState(user);
    await user.save();

    const updatedUser = await sendToken(user._id);

    return NextResponse.json(
      { success: true, message: 'Password updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update password' },
      { status: 500 }
    );
  }
}
