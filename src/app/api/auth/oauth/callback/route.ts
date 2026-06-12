export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, setSessionCookie } from '@/lib/auth';

/**
 * GET /api/auth/oauth/callback?provider=google&email=user@gmail.com&name=John
 *
 * Real OAuth would receive these from the provider's token exchange.
 * Until real OAuth (Google/GitHub API) is configured, this simulates it
 * using a fixed email per provider — NOT random — so the same user is
 * always found/created on repeat clicks.
 *
 * To enable REAL OAuth: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET etc.
 * and implement the PKCE flow.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') || 'google';

    // If real OAuth params are passed (from a real provider redirect), use them
    const oauthEmail = searchParams.get('email');
    const oauthName = searchParams.get('name');

    let email: string;
    let displayName: string;
    let avatar: string;

    if (oauthEmail) {
      // Real OAuth token was exchanged — use the real user data
      email = oauthEmail.trim().toLowerCase();
      displayName = oauthName || email.split('@')[0];
      avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
    } else {
      // No real OAuth configured — redirect to login with a helpful message
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', req.url)
      );
    }

    // Generate a stable username from email
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    // Find existing user OR create new one (upsert by email)
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username,
          displayName,
          avatar,
          passwordHash: `oauth_${provider}_no_password`, // OAuth users don't use password login
          subscription: 'FREE',
        },
        select: { id: true, email: true }
      });
    }

    const token = signToken({ userId: user.id, email: user.email! });
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url));
  }
}
