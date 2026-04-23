import { NextResponse } from "next/server";
import axios from "axios";

const SOCKET_CHAT_API_BASE =
  process.env.SOCKET_BACKEND_URL || "http://localhost:4000/api/v1";

export async function POST(request) {
  try {
    const payload = await request.json();

    const response = await axios.post(
      `${SOCKET_CHAT_API_BASE}/chat/ask-and-record`,
      payload,
      {
        withCredentials: true,
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error?.response?.status || 500;

    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || "Failed to process ask-and-record",
      },
      { status }
    );
  }
}
