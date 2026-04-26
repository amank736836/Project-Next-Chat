import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/server/db.js";
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

    const messages = await Message.find({})
      .sort({ createdAt: -1 })
      .populate("sender", "name avatar")
      .populate("chat", "groupChat")
      .lean();

    const transformedMessages = messages.map(
      ({ _id, content, sender, chat, attachments, createdAt }) => ({
        _id,
        content,
        attachments,
        createdAt,
        chat: chat?._id,
        groupChat: chat?.groupChat,
        sender: sender
          ? {
              _id: sender._id,
              name: sender.name,
              avatar: sender.avatar?.url || "",
            }
          : {
              _id: null,
              name: "Unknown",
              avatar: "",
            },
      })
    );

    return NextResponse.json(
      { success: true, message: "All messages", messages: transformedMessages },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to get messages" },
      { status: 500 }
    );
  }
}

