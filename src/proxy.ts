import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { apiLimiter, tweetLimiter, authLimiter } from '@/lib/rate-limit';

export default async function proxy(request: NextRequest) {
  const session = (await cookies()).get('session')?.value;
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  // --- API RATE LIMITING ---
  if (path.startsWith('/api')) {
    if (path.startsWith('/api/auth/')) {
      if (!authLimiter.check(ip)) {
        return new NextResponse(
          JSON.stringify({ error: 'Too Many Requests - Please wait a minute before trying to log in or register again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    if (path === '/api/tweets' && request.method === 'POST') {
      if (!tweetLimiter.check(ip)) {
        return new NextResponse(
          JSON.stringify({ error: 'Too Many Requests - Please slow down posting tweets.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!apiLimiter.check(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests - Rate limit exceeded.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  // -------------------------

  const protectedPaths = ['/dashboard', '/explore', '/messages', '/profile', '/settings', '/notifications'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login/register, redirect to dashboard
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  // --- SECURITY HEADERS ---
  const isApi = path.startsWith('/api/');
  
  // HSTS (HTTP Strict Transport Security) - Force browsers to always use HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Control referrer information sent
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Basic XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent caching of sensitive API routes
  if (isApi) {
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
