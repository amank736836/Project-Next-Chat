import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/server/db.js";
import Chat from "../../../../../lib/server/models/chat.model.js";
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

    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    const transformedUsers = await Promise.all(
      users.map(async ({ _id, name, avatar, email, username, createdAt }) => {
        const [friends, groups] = await Promise.all([
          Chat.countDocuments({ groupChat: false, members: _id }),
          Chat.countDocuments({ groupChat: true, members: _id }),
        ]);

        return {
          _id,
          avatar: avatar?.url || "",
          name,
          email,
          username,
          friends,
          groups,
          createdAt,
        };
      })
    );

    return NextResponse.json(
      { success: true, message: "All users", users: transformedUsers },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to get users" },
      { status: 500 }
    );
  }
}

