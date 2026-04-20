import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/server/db.js';
import Message from '../../../../../../lib/server/models/message.model.js';
import { getAuthenticatedUser } from '../../../../../../lib/server/auth.js';

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }
    
    const { chatId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalMessages = await Message.countDocuments({ chat: chatId });
    const totalPages = Math.ceil(totalMessages / limit);
    
    return NextResponse.json(
      { success: true, messages: messages.reverse(), totalPages, currentPage: page },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get messages' },
      { status: 500 }
    );
  }
}
