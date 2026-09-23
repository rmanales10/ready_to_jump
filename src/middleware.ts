import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'readytojump-admin-super-secure-jwt-secret-key-2026';
const encodedSecret = new TextEncoder().encode(SECRET_KEY);
const COOKIE_NAME = 'admin_token';

// Protected admin routes
const PROTECTED_ROUTES = ['/dashboard', '/bug-reports', '/courses'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, encodedSecret);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. If accessing a protected route without valid JWT, redirect to login page
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Clear invalid cookie if present
    if (token) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  }

  // 2. If accessing the login page ('/') while already authenticated, redirect to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/bug-reports/:path*',
    '/courses/:path*',
  ],
};
