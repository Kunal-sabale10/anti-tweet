import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Read session from request cookies (Edge-compatible — NOT cookies() from next/headers)
  const session = request.cookies.get('session')?.value;
  const path = request.nextUrl.pathname;

  // --- PROTECTED ROUTES: redirect unauthenticated users to login ---
  const protectedPaths = ['/dashboard', '/explore', '/messages', '/profile', '/settings', '/notifications'];
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- AUTH PAGES: redirect authenticated users to dashboard ---
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some(p => path === p || path.startsWith(p + '/'));

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- Build response with security headers ---
  const response = NextResponse.next();

  // HSTS
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent caching of API routes
  if (path.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/explore/:path*', '/messages/:path*',
    '/profile/:path*', '/settings/:path*', '/notifications/:path*',
    '/login', '/register', '/api/:path*'
  ],
};
