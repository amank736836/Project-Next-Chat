import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }
    
    const { isAcceptingMessage } = await request.json();
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { isAcceptingMessage },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Accepting messages updated',
        isAcceptingMessage: updatedUser.isAcceptingMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('acceptMessages route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to update accepting messages',
      },
      { status: 500 }
    );
  }
}
