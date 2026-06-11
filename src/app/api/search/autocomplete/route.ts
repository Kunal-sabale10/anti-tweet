import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) return NextResponse.json({ users: [], hashtags: [] });

    // Search users
    const usersData = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } }
        ]
      },
      take: 5,
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        avatar: true,
        followers: { where: { followerId: session.userId }, select: { id: true } }
      }
    });

    const users = usersData.map(u => ({
      ...u,
      isFollowing: u.followers.length > 0
    }));

    // Search hashtags (without the #)
    const cleanQ = q.startsWith('#') ? q.slice(1) : q;
    const hashtags = await prisma.hashtag.findMany({
      where: { tag: { contains: cleanQ } },
      take: 5,
      select: { id: true, tag: true, count: true }
    });

    return NextResponse.json({ success: true, users, hashtags });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
