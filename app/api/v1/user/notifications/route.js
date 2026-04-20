import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import Request from '../../../../../lib/server/models/request.model.js';
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
    
    const requests = await Request.find({
      receiver: user._id,
      status: 'pending',
    }).populate('sender', 'name username avatar');
    
    const allRequests = requests.map(req => ({
      _id: req._id,
      sender: req.sender,
    }));
    
    return NextResponse.json(
      { success: true, allRequests },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}
