import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../../lib/server/db.js';
import Chat from '../../../../../lib/server/models/chat.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const rawChatId = searchParams.get('chatId');
    const hasValidChatId =
      Boolean(rawChatId) &&
      rawChatId !== 'undefined' &&
      rawChatId !== 'null' &&
      mongoose.Types.ObjectId.isValid(rawChatId);

    const directChats = await Chat.find({
      members: user._id,
      groupChat: false,
    }).populate('members', 'name username avatar');

    const uniqueFriendsMap = new Map();
    for (const chat of directChats) {
      const otherMember = chat.members.find(
        (member) => member?._id?.toString() !== user._id.toString()
      );

      if (otherMember?._id) {
        uniqueFriendsMap.set(otherMember._id.toString(), {
          _id: otherMember._id,
          name: otherMember.name,
          username: otherMember.username,
          avatar: otherMember.avatar,
        });
      }
    }

    let friends = Array.from(uniqueFriendsMap.values());

    if (hasValidChatId) {
      const chat = await Chat.findById(rawChatId).select('members');

      if (chat) {
        const chatMemberIds = new Set(chat.members.map((memberId) => memberId.toString()));
        friends = friends.filter((friend) => !chatMemberIds.has(friend._id.toString()));
      }
    }

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
