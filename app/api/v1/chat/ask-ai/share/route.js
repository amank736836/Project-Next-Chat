import { NextResponse } from "next/server";
import axios from "axios";

const SOCKET_CHAT_API_BASE =
  process.env.SOCKET_BACKEND_URL || "http://localhost:4000/api/v1";

/**
 * Publishes an already-previewed private AI answer to the whole chat.
 * The text is shared as-is (no regeneration).
 */
export async function POST(request) {
  try {
    const payload = await request.json();

    const response = await axios.post(
      `${SOCKET_CHAT_API_BASE}/chat/ask-ai/share`,
      payload,
      { headers: { Cookie: request.headers.get("cookie") || "" } }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error?.response?.status || 500;

    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || "Could not share with chat. Try again.",
      },
      { status }
    );
  }
}
