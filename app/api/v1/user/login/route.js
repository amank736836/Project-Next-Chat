import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { sendToken } from '../../../../../lib/server/auth.js';

export async function POST(request) {
  try {
    await connectDB();

    const { identifier, password } = await request.json();

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
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
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
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
