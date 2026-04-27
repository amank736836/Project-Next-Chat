import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { sendForgotPasswordEmail } from '../../../../../lib/server/email.js';

export async function POST(request) {
  try {
    await connectDB();
    
    const { identifier } = await request.json();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyCode = verifyCode;
    user.verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailSent = await sendForgotPasswordEmail(user.email, verifyCode, user.name);

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Verification code sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('ForgotPassword API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
