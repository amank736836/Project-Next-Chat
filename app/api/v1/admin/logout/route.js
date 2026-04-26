import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STEALTHY_NOTE_ADMIN_TOKEN_NAME } from "../../../../../lib/server/auth.js";

export async function GET() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(STEALTHY_NOTE_ADMIN_TOKEN_NAME);

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Logout failed" },
      { status: 500 }
    );
  }
}

