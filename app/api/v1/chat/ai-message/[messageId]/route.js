import { NextResponse } from "next/server";
import axios from "axios";

const SOCKET_CHAT_API_BASE =
  process.env.SOCKET_BACKEND_URL || "http://localhost:4000/api/v1";

/** Proxies private AI answer deletion to the realtime backend. */
export async function DELETE(request, { params }) {
  try {
    const { messageId } = await params;

    const response = await axios.delete(
      `${SOCKET_CHAT_API_BASE}/chat/ai-message/${messageId}`,
      { headers: { Cookie: request.headers.get("cookie") || "" } }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error?.response?.status || 500;

    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || "Could not delete. Try again.",
      },
      { status }
    );
  }
}
