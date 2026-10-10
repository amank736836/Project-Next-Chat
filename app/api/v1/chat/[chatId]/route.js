import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import Chat from '../../../../../lib/server/models/chat.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

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

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please login to access this resource' },
        { status: 401 }
      );
    }
    
    const { chatId } = await params;
    const url = new URL(request.url);
    const populate = url.searchParams.get('populate') === 'true';
    
    let query = Chat.findById(chatId);
    if (populate) {
      query = query.populate('members', 'name username avatar');
    }
    
    const chat = await query;

    if (!chat) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      );
    }

    // SECURITY: only chat members may read chat details (prevents IDOR).
    const isMember = (chat.members || []).some(
      (member) => member.toString() === user._id.toString()
    );
    if (!isMember) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, chat },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to get chat details' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { chatId } = await params;
  return proxyToBackend(request, 'PUT', `/chat/${chatId}`);
}

export async function DELETE(request, { params }) {
  const { chatId } = await params;
  return proxyToBackend(request, 'DELETE', `/chat/${chatId}`);
}
