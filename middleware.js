import { NextResponse } from 'next/server';
import { verifyAdminToken, STEALTHY_NOTE_ADMIN_TOKEN_NAME, cookieOptions } from './lib/middleware-utils';

const adminRoutes = ['/admin', '/admin/dashboard', '/admin/users', '/admin/chats', '/admin/messages'];

const clearAdminToken = () => {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.cookies.set(STEALTHY_NOTE_ADMIN_TOKEN_NAME, '', {
    ...cookieOptions,
    maxAge: 0
  });
  return response;
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
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
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return clearAdminToken();
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
};