import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }
    
    const searchParams = new URL(request.url).searchParams;
    const name = searchParams.get('name');
    
    const users = await User.find({
      name: { $regex: name, $options: 'i' },
      _id: { $ne: user._id },
    }).select('name username avatar');
    
    return NextResponse.json(
      { success: true, users },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Search failed' },
      { status: 500 }
    );
  }
}
