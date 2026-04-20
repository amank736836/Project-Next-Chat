import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL || "http://localhost:4000/api/v1";

const hasBody = (method) => ["POST", "PUT", "PATCH", "DELETE"].includes(method);

const buildProxyResponse = async (response) => {
  let data;

  try {
    data = await response.json();
  } catch {
    data = {
      success: response.ok,
      message: response.ok ? "Request completed" : "Backend request failed",
    };
  }

  const nextResponse = NextResponse.json(data, {
    status: response.status,
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  return nextResponse;
};

const proxyRequest = async (request, method) => {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/v1", "");

  try {
    const requestHeaders = {
      Cookie: request.headers.get("cookie") || "",
    };

    const requestInit = {
      method,
      headers: requestHeaders,
    };

    if (hasBody(method)) {
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        requestInit.body = await request.formData();
      } else if (contentType.includes("application/json")) {
        const json = await request.json();
        requestInit.body = JSON.stringify(json);
        requestHeaders["Content-Type"] = "application/json";
      } else {
        const text = await request.text();
        if (text) {
          requestInit.body = text;
          requestHeaders["Content-Type"] = contentType || "text/plain";
        }
      }
    }

    const response = await fetch(`${BACKEND_URL}${path}${url.search}`, requestInit);

    return buildProxyResponse(response);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
};

export async function GET(request) {
  return proxyRequest(request, "GET");
}

export async function POST(request) {
  return proxyRequest(request, "POST");
}

export async function PUT(request) {
  return proxyRequest(request, "PUT");
}

export async function DELETE(request) {
  return proxyRequest(request, "DELETE");
}
