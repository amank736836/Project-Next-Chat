import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import User from '../../../../../lib/server/models/user.model.js';
import Chat from '../../../../../lib/server/models/chat.model.js';
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
    const chatId = searchParams.get('chatId');
    
    let friendsQuery = User.find({
      _id: { $in: user.friends || [] },
    }).select('name username avatar');
    
    if (chatId) {
      const chat = await Chat.findById(chatId).populate('members');
      const chatMemberIds = chat.members.map(m => m._id.toString());
      friendsQuery = friendsQuery.where('_id').nin(chatMemberIds);
    }
    
    const friends = await friendsQuery;
    
    return NextResponse.json(
      { success: true, friends },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get friends' },
      { status: 500 }
    );
  }
}
