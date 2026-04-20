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

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const response = await fetch(`${BACKEND_URL}/user/me${url.search}`, {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    return buildProxyResponse(response);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
