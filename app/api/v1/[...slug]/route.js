import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000/api/v1';

export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v1', '');

  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      body: formData,
    });

    const data = await response.json();

    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
