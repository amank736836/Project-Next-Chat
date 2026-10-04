import { NextResponse } from "next/server";
import axios from "axios";

const SOCKET_CHAT_API_BASE =
  process.env.SOCKET_BACKEND_URL || "http://localhost:4000/api/v1";

/**
 * Proxies Ask-AI to the realtime backend.
 * mode "private" (default): answer saved visibly only to the asker + emitted
 * to them alone. mode "shared": saved + broadcast to every member.
 */
export async function POST(request) {
  try {
    const payload = await request.json();

    const response = await axios.post(
      `${SOCKET_CHAT_API_BASE}/chat/ask-ai`,
      payload,
      { headers: { Cookie: request.headers.get("cookie") || "" } }
    );

    const nextResponse = NextResponse.json(response.data, {
      status: response.status,
    });

    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie);
    }

    return nextResponse;
  } catch (error) {
    const status = error?.response?.status || 500;

    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || "AI could not answer right now. Try again.",
      },
      { status }
    );
  }
}
