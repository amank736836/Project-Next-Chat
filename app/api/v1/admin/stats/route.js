import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/server/db.js";
import Chat from "../../../../../lib/server/models/chat.model.js";
import Message from "../../../../../lib/server/models/message.model.js";
import User from "../../../../../lib/server/models/user.model.js";
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

    const [groupChatCount, totalUsers, totalChats, totalMessages] =
      await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Chat.countDocuments(),
        Message.countDocuments(),
      ]);

    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last7DaysMessages = await Message.find({
      createdAt: { $gte: last7Days, $lte: today },
    }).select("createdAt");

    const messages = new Array(7).fill(0);
    last7DaysMessages.forEach(({ createdAt }) => {
      const index = today.getDate() - createdAt.getDate();
      messages[6 - index] += 1;
    });

    const stats = {
      totalUsers,
      totalChats,
      totalMessages,
      groupChatCount,
      singleChatCount: totalChats - groupChatCount,
      last7DaysMessages: messages,
    };

    return NextResponse.json(
      { success: true, message: "Dashboard stats", stats },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to get dashboard stats" },
      { status: 500 }
    );
  }
}

