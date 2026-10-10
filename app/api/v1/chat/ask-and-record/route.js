import { NextResponse } from "next/server";
import axios from "axios";
import { withCors, corsPreflight } from "../../../../../lib/server/cors.js";
import { rateLimit, rateLimitedResponse } from "../../../../../lib/server/rateLimit.js";

const SOCKET_CHAT_API_BASE =
  process.env.SOCKET_BACKEND_URL || "http://localhost:4000/api/v1";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request) {
  // SECURITY: anonymous endpoint — limit per-IP spam against the backend.
  const limitResult = rateLimit({ scope: "ask-and-record", request, limit: 20, windowMs: 15 * 60 * 1000 });
  if (limitResult.limited) {
    return rateLimitedResponse(limitResult, NextResponse);
  }

  try {
    const payload = await request.json();

    // Forward cookies + origin so the backend can auth and attribute the host.
    const headers = { Cookie: request.headers.get("cookie") || "" };
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    if (origin) headers.Origin = origin;
    if (referer) headers.Referer = referer;

    const response = await axios.post(
      `${SOCKET_CHAT_API_BASE}/chat/ask-and-record`,
      payload,
      { headers }
    );

    return withCors(response.data, { status: response.status });
  } catch (error) {
    const status = error?.response?.status || 500;

    return withCors(
      {
        success: false,
        message: error?.response?.data?.message || "Failed to process ask-and-record",
      },
      { status }
    );
  }
}
