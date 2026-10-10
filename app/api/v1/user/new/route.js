import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import Chat from '../../../../../lib/server/models/chat.model.js';
import { sendToken } from '../../../../../lib/server/auth.js';
import { uploadFilesToCloudinary } from '../../../../../lib/server/cloudinary.js';
import { sendVerificationEmail } from '../../../../../lib/server/email.js';
import { v4 as uuid } from 'uuid';
import { rateLimit, rateLimitedResponse } from '../../../../../lib/server/rateLimit.js';
import { generateVerificationCode, CODE_TTL_MS } from '../../../../../lib/server/verification.js';

export async function POST(request) {
  // SECURITY: registrations trigger email sends — rate-limit this endpoint.
  const limitResult = rateLimit({ scope: 'user-register', request, limit: 5, windowMs: 15 * 60 * 1000 });
  if (limitResult.limited) {
    return rateLimitedResponse(limitResult, NextResponse);
  }

  try {
    await connectDB();

    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const username = formData.get('username');
    const password = formData.get('password');
    const avatarFile = formData.get('avatar');

    if (!name || !email || !username || !password || !avatarFile) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }

    // SECURITY: cryptographically secure code (never Math.random()).
    const verifyCode = generateVerificationCode();

    const avatarBuffer = Buffer.from(await avatarFile.arrayBuffer());
    const avatarBase64 = `data:${avatarFile.type};base64,${avatarBuffer.toString('base64')}`;

    const avatar = await uploadFilesToCloudinary([
      { arrayBuffer: () => avatarBuffer, type: avatarFile.type, name: avatarFile.name }
    ]);

    const user = await User.create({
      name,
      email,
      username,
      password,
      avatar: avatar[0],
      verifyCode,
      verifyCodeExpiry: new Date(Date.now() + CODE_TTL_MS),
      verifyCodeAttempts: 0,
    });

    const baseUrl = new URL(request.url).origin;
    await sendVerificationEmail({
      email,
      code: verifyCode,
      name,
      identifier: username || email,
      baseUrl,
    });

    await Chat.create({
      name: username,
      members: [user._id],
    });

    const createdUser = await sendToken(user._id);

    return NextResponse.json(
      { success: true, message: 'User registered successfully', user: createdUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
