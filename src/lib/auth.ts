import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SessionPayload } from '@/lib/types';

// Get JWT secret lazily — don't throw at module load since build-time has NODE_ENV=production but no env vars
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In dev, use a fallback; in production, warn but don't crash the build
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: JWT_SECRET is not set. Using fallback. Set JWT_SECRET in your environment variables!');
    }
    return 'dev-only-secret-not-for-production';
  }
  return secret;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set session cookie on a NextResponse object.
 * This is the SAFE way to set cookies from Route Handlers.
 */
export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
  return response;
}

/**
 * Legacy setCookie — uses cookies() from next/headers.
 * Still works in Server Components and Server Actions.
 * For Route Handlers, prefer setSessionCookie() instead.
 */
export async function setCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifyToken(sessionCookie.value);
}
