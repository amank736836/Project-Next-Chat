import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { sendForgotPasswordEmail } from '../../../../../lib/server/email.js';
import { rateLimit, rateLimitedResponse } from '../../../../../lib/server/rateLimit.js';
import { generateVerificationCode, CODE_TTL_MS } from '../../../../../lib/server/verification.js';

export async function POST(request) {
  // SECURITY: this endpoint is unauthenticated — rate-limit it to prevent
  // account enumeration probes and email-bombing.
  const limitResult = rateLimit({ scope: 'user-forgot-password', request, limit: 5, windowMs: 15 * 60 * 1000 });
  if (limitResult.limited) {
    return rateLimitedResponse(limitResult, NextResponse);
  }

  try {
    await connectDB();

    let identifier;
    try {
      ({ identifier } = await request.json());
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Identifier is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user) {
      // SECURITY: cryptographically secure code (never Math.random()).
      const verifyCode = generateVerificationCode();
      user.verifyCode = verifyCode;
      user.verifyCodeExpiry = new Date(Date.now() + CODE_TTL_MS);
      user.verifyCodeAttempts = 0;
      await user.save();

      const baseUrl = new URL(request.url).origin;
      const emailSent = await sendForgotPasswordEmail({
        email: user.email,
        code: verifyCode,
        name: user.name,
        identifier: user.username || user.email,
        baseUrl,
      });

      if (!emailSent) {
        return NextResponse.json(
          { success: false, message: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }
    }

    // SECURITY: identical response whether or not the account exists, so the
    // endpoint cannot be used to enumerate registered users.
    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists for that identifier, a verification code has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ForgotPassword API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
