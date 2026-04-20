import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { sendToken } from '../../../../../lib/server/auth.js';

export async function POST(request) {
  try {
    await connectDB();

    const { identifier, verifyCode } = await request.json();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.verifyCode !== verifyCode) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (new Date(user.verifyCodeExpiry) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Verification code expired' },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verifyCode = undefined;
    user.verifyCodeExpiry = undefined;
    await user.save();

    const verifiedUser = await sendToken(user._id);

    return NextResponse.json(
      { success: true, message: 'User verified successfully', user: verifiedUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
