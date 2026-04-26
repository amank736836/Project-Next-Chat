import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/server/db.js';
import Chat from '../../../../lib/server/models/chat.model.js';
import { getAuthenticatedUser } from '../../../../lib/server/auth.js';

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }

    const chats = await Chat.find({ members: user._id })
      .populate('members', 'name avatar')
      .sort({ updatedAt: -1 });

    const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
      const otherMember = members.find(
        (member) => member._id.toString() !== user._id.toString()
      );

      return {
        _id,
        name: groupChat ? name : otherMember?.name || 'Anonymous Inbox',
        groupChat,
        avatar: groupChat
          ? members.slice(0, 3).map(({ avatar }) => avatar?.url || '')
          : [otherMember?.avatar?.url || ''],
        members: members.reduce((acc, member) => {
          if (member._id.toString() !== user._id.toString()) {
            acc.push(member._id.toString());
          }
          return acc;
        }, []),
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Chats fetched successfully',
        chats: transformedChats,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
