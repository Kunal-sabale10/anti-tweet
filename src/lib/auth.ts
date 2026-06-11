import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { SessionPayload } from '@/lib/types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-anti-tweet-key-2026';

export async function signToken(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifyToken(sessionCookie.value);
}
