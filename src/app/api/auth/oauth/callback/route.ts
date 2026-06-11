import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, setCookie } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') || 'google';

    // Mock OAuth data
    const email = `mockuser_${Math.random().toString(36).substring(7)}@${provider}.com`;
    const username = `${provider}_user_${Math.floor(Math.random() * 1000)}`;
    const displayName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
    const avatar = `https://ui-avatars.com/api/?name=${provider}+User&background=random`;

    // Check if user exists or create them
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username,
          displayName,
          avatar,
          passwordHash: 'oauth_dummy_hash', // In reality, OAuth users don't need a password hash
        }
      });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email!
    });

    await setCookie(token);

    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}
