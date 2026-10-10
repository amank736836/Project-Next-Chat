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
    const name = (searchParams.get('name') || '').trim().slice(0, 60);

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Search term is required' },
        { status: 400 }
      );
    }

    // SECURITY: escape regex metacharacters — raw user input in $regex
    // allows ReDoS and regex-injection attacks.
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      name: { $regex: escapedName, $options: 'i' },
      _id: { $ne: user._id },
    }).select('name username avatar').limit(50);
    
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
