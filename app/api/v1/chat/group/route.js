import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_SERVER_URL || 'http://localhost:4000/api/v1';

const buildProxyResponse = async (response) => {
  let data;

  try {
    data = await response.json();
  } catch {
    data = {
      success: response.ok,
      message: response.ok ? 'Request completed' : 'Backend request failed',
    };
  }

  const nextResponse = NextResponse.json(data, {
    status: response.status,
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    nextResponse.headers.set('set-cookie', setCookie);
  }

  return nextResponse;
};

const proxyToBackend = async (request, method, path) => {
  const requestHeaders = {
    Cookie: request.headers.get('cookie') || '',
  };

  const requestInit = {
    method,
    headers: requestHeaders,
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      requestInit.body = await request.formData();
    } else if (contentType.includes('application/json')) {
      requestHeaders['Content-Type'] = 'application/json';
      requestInit.body = JSON.stringify(await request.json());
    } else {
      const text = await request.text();
      if (text) {
        requestHeaders['Content-Type'] = contentType || 'text/plain';
        requestInit.body = text;
      }
    }
  }

  const url = new URL(request.url);
  const response = await fetch(`${BACKEND_URL}${path}${url.search}`, requestInit);
  return buildProxyResponse(response);
};

export async function GET(request) {
  return proxyToBackend(request, 'GET', '/chat/group');
}

export async function POST(request) {
  return proxyToBackend(request, 'POST', '/chat/group');
}

export async function PUT(request) {
  return proxyToBackend(request, 'PUT', '/chat/group');
}

export async function DELETE(request) {
  return proxyToBackend(request, 'DELETE', '/chat/group');
}
