import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/server/db.js";
import Chat from "../../../../../lib/server/models/chat.model.js";
import { getAuthenticatedUser } from "../../../../../lib/server/auth.js";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please login to access this resource" },
        { status: 401 }
      );
    }

    await connectDB();

    const chats = await Chat.find({
      members: user._id,
      groupChat: true,
      creator: user._id,
    })
      .populate("members", "name avatar")
      .sort({ updatedAt: -1 });

    const groups = chats.map(({ _id, name, groupChat, members }) => ({
      _id,
      name,
      groupChat,
      avatar: members.slice(0, 3).map(({ avatar }) => avatar?.url || ""),
      members: members.map(({ _id }) => _id),
    }));

    return NextResponse.json(
      { success: true, message: "Groups fetched successfully", groups },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to get groups" },
      { status: 500 }
    );
  }
}
