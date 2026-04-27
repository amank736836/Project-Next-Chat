import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';
import Request from '../../../../../lib/server/models/request.model.js';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }

    const notificationCount = await Request.countDocuments({
      receiver: user._id,
      status: 'pending',
    });

    return NextResponse.json(
      { success: true, user, notificationCount },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
