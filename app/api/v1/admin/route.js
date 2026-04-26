import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "../../../../lib/server/auth.js";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Please login to access this resource" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Welcome to Stealthy Note Admin Dashboard",
        admin: true,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

