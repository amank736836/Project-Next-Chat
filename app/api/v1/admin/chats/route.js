import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/server/db.js";
import Chat from "../../../../../lib/server/models/chat.model.js";
import Message from "../../../../../lib/server/models/message.model.js";
import { getAuthenticatedAdmin } from "../../../../../lib/server/auth.js";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Please login to access this resource" },
        { status: 401 }
      );
    }

    await connectDB();

    const chats = await Chat.find({})
      .sort({ createdAt: -1 })
      .populate("members", "name avatar")
      .populate("creator", "name avatar")
      .lean();

    const transformedChats = await Promise.all(
      chats.map(async ({ _id, name, groupChat, members, creator }) => {
        const memberDetails = (members || []).map((member) => ({
          _id: member?._id,
          name: member?.name,
          avatar: member?.avatar?.url || "",
        }));

        const totalMessages = await Message.countDocuments({ chat: _id });

        return {
          _id,
          name,
          groupChat,
          totalMessages,
          members: memberDetails,
          totalMembers: members?.length || 0,
          avatar: memberDetails.slice(0, 3).map((member) => member.avatar),
          creator: {
            _id: creator?._id || null,
            name: creator?.name || "None",
            avatar: creator?.avatar?.url || "",
          },
        };
      })
    );

    return NextResponse.json(
      { success: true, message: "All chats", chats: transformedChats },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to get chats" },
      { status: 500 }
    );
  }
}

