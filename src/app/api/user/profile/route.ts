export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        subscription: true,
        language: true,
        notificationPref: true,
        avatar: true,
        username: true,
        displayName: true,
        bio: true,
        dmPrivacy: true,
        tweetPrivacy: true,
        createdAt: true,
        _count: { select: { followers: true, following: true } },
        tweets: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            audioUrl: true,
            createdAt: true,
          }
        },
        loginSessions: {
          orderBy: { loggedInAt: 'desc' },
          take: 5,
          select: {
            id: true,
            browserType: true,
            os: true,
            deviceCat: true,
            ipAddress: true,
            loggedInAt: true,
          }
        }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
