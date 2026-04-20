import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import Request from '../../../../../lib/server/models/request.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }
    
    const { isAcceptingMessage } = await request.json();
    
    user.isAcceptingMessage = isAcceptingMessage;
    await user.save();
    
    return NextResponse.json(
      { success: true, message: 'Accepting messages updated', isAcceptingMessage: user.isAcceptingMessage },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update accepting messages' },
      { status: 500 }
    );
  }
}
