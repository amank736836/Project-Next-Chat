import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import Chat from '../../../../../lib/server/models/chat.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

/** Toggle per-chat AI mode (Ask AI button visibility). Defaults to enabled. */
export async function PUT(request) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Please login to continue' },
        { status: 401 }
      );
    }

    const { chatId, enabled } = await request.json();

    if (!chatId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'chatId and enabled are required' },
        { status: 400 }
      );
    }

    const chat = await Chat.findById(chatId).select('_id members');

    if (!chat) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      );
    }

    const isMember = (chat.members || []).some(
      (member) => String(member) === String(authUser._id)
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this chat' },
        { status: 403 }
      );
    }

    chat.aiEnabled = enabled;
    await chat.save();

    return NextResponse.json({ success: true, aiEnabled: enabled }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to update AI mode' },
      { status: 500 }
    );
  }
}
