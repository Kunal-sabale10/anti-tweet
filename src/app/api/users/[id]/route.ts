export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { followers: true, following: true } },
        ...(session?.userId === id && { loginSessions: { orderBy: { loggedInAt: 'desc' }, take: 5 } })
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let isFollowing = false;
    let followsMe = false;
    if (session) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.userId, followingId: id } }
      });
      isFollowing = !!follow;
      
      const mutual = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: id, followingId: session.userId } }
      });
      followsMe = !!mutual;
    }

    // Determine if we should show them as online (active within last 3 minutes)
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
    const isOnlineNow = user.isOnline && user.lastSeen > threeMinsAgo;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      isOnline: isOnlineNow,
      lastSeen: user.lastSeen,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      followsMe,
      dmPrivacy: user.dmPrivacy,
      subscription: user.subscription,
      // @ts-ignore - Prisma dynamic include
      loginSessions: user.loginSessions || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (session.userId !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { displayName, bio, avatar, banner } = await req.json();

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(banner !== undefined && { banner }),
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
