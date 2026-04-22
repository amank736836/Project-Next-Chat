import { NextResponse } from "next/server";
import User from "../../../../../lib/server/models/user.model";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    
    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ username });
    
    return NextResponse.json(
      {
        success: true,
        available: !user,
        message: user ? "Username taken" : "Username available"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}