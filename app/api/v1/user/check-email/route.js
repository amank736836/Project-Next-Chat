import { NextResponse } from "next/server";
import User from "../../../../../lib/server/models/user.model";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ email });
    
    return NextResponse.json(
      {
        success: true,
        available: !user,
        message: user ? "Email already exists" : "Email available"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}
