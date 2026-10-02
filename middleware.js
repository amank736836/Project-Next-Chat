import { NextResponse } from 'next/server';
import { verifyAdminToken, STEALTHY_NOTE_ADMIN_TOKEN_NAME, cookieOptions } from './lib/middleware-utils';

const adminRoutes = ['/admin', '/admin/dashboard', '/admin/users', '/admin/chats', '/admin/messages'];

// Dev-only tooling (e.g. the /dev/socket realtime test bench). It is blocked
// here rather than only inside the page because a notFound() thrown while the
// page streams cannot change the already-sent 200 status line.
const devToolRoutes = ['/dev'];

const areDevToolsEnabled = () =>
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_TOOLS === 'true';

const clearAdminToken = (request) => {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.cookies.set(STEALTHY_NOTE_ADMIN_TOKEN_NAME, '', {
    ...cookieOptions,
    maxAge: 0
  });
  return response;
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    devToolRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) &&
    !areDevToolsEnabled()
  ) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 });
  }

  // Only process admin routes
  if (!adminRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow login page without authentication
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  try {
    const admin = await verifyAdminToken();
    
    if (!admin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    return clearAdminToken(request);
  }
}

export const config = {
  // jsonwebtoken verifies signatures with Node crypto, which Edge cannot run.
  runtime: 'nodejs',
  matcher: ['/admin', '/admin/:path*', '/dev', '/dev/:path*']
};