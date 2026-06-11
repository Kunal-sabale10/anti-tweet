import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/search?q=term
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() || '';

    if (!q) {
      // Return trending hashtags when no query
      const recentTweets = await prisma.tweet.findMany({
        where: { createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { content: true },
        take: 500
      });

      const hashtagCounts: Record<string, number> = {};
      recentTweets.forEach(t => {
        const matches = t.content?.match(/#[\w]+/g) || [];
        matches.forEach(tag => {
          const lower = tag.toLowerCase();
          hashtagCounts[lower] = (hashtagCounts[lower] || 0) + 1;
        });
      });

      const trending = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      return NextResponse.json({ tweets: [], users: [], trending });
    }

    // Advanced Search parsing
    let searchContent = q;
    let fromUsername = null;
    const fromMatch = q.match(/from:([\w]+)/i);
    if (fromMatch) {
      fromUsername = fromMatch[1];
      searchContent = q.replace(fromMatch[0], '').trim();
    }

    // Search tweets
    const tweets = await prisma.tweet.findMany({
      where: {
        content: searchContent ? { contains: searchContent } : undefined,
        user: fromUsername ? { username: fromUsername } : undefined,
        OR: [
          { user: { tweetPrivacy: 'PUBLIC' } },
          { userId: session.userId },
          {
            user: {
              tweetPrivacy: 'FOLLOWERS',
              followers: { some: { followerId: session.userId } }
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, replies: true } },
        likes: { where: { userId: session.userId }, select: { id: true } }
      }
    });

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
          { email: { contains: q } },
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        dmPrivacy: true,
        _count: { select: { followers: true, following: true } },
        followers: { where: { followerId: session.userId }, select: { id: true } }
      },
      take: 10
    });

    const mappedTweets = tweets.map(t => ({
      id: t.id,
      content: t.content,
      audioUrl: t.audioUrl,
      createdAt: t.createdAt.toISOString(),
      likeCount: t._count.likes,
      replyCount: t._count.replies,
      likedByMe: t.likes.length > 0,
      isFollowersOnly: false,
      user: {
        id: t.user.id,
        email: t.user.email ?? '',
        username: t.user.username,
        displayName: t.user.displayName,
        avatar: t.user.avatar,
      }
    }));

    const mappedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      dmPrivacy: u.dmPrivacy,
      followerCount: u._count.followers,
      followingCount: u._count.following,
      isFollowing: u.followers.length > 0,
    }));

    return NextResponse.json({ tweets: mappedTweets, users: mappedUsers, trending: [] });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
