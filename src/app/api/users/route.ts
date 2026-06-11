import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { unstable_cache } from 'next/cache';

const getTopUsersCache = unstable_cache(
  async () => {
    return await prisma.user.findMany({
      select: {
        id: true, email: true, username: true, displayName: true, avatar: true, dmPrivacy: true,
        _count: { select: { followers: true, following: true } }
      },
      orderBy: { followers: { _count: 'desc' } },
      take: 50
    });
  },
  ['top-users-global'],
  { revalidate: 60 }
);

// GET /api/users — who to follow (excludes self + already following)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const following = await prisma.follow.findMany({
      where: { followerId: session.userId },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    const cachedUsers = await getTopUsersCache();
    const excludeSet = new Set([session.userId, ...followingIds]);
    const users = cachedUsers.filter(u => !excludeSet.has(u.id)).slice(0, 5);

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      dmPrivacy: u.dmPrivacy,
      followerCount: u._count.followers,
      followingCount: u._count.following,
      isFollowing: false,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
