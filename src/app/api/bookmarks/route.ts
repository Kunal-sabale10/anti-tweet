import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        tweet: {
          include: {
            user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } },
            _count: { select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true } },
            likes: { where: { userId: session.userId }, select: { id: true } },
            tweetRetweets: { where: { userId: session.userId }, select: { id: true } },
            bookmarks: { where: { userId: session.userId }, select: { id: true } },
            retweetOf: {
              include: { user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } } }
            }
          }
        }
      }
    });

    const mapped = bookmarks.map(b => {
      const t = b.tweet;
      const baseTweet = {
        id: t.id,
        content: t.content,
        audioUrl: t.audioUrl,
        imageUrl: t.imageUrl,
        createdAt: t.createdAt.toISOString(),
        likeCount: t._count.likes,
        replyCount: t._count.replies,
        retweetCount: t._count.tweetRetweets,
        bookmarkCount: t._count.bookmarks,
        likedByMe: t.likes.length > 0,
        retweetedByMe: t.tweetRetweets.length > 0,
        bookmarkedByMe: t.bookmarks.length > 0,
        isFollowersOnly: false,
        isQuote: t.isQuote,
        retweetOfId: t.retweetOfId,
        user: {
          id: t.user.id,
          email: t.user.email ?? '',
          username: t.user.username,
          displayName: t.user.displayName,
          avatar: t.user.avatar,
        }
      };

      if (t.retweetOf) {
        (baseTweet as any).retweetOf = {
          id: t.retweetOf.id,
          content: t.retweetOf.content,
          audioUrl: t.retweetOf.audioUrl,
          imageUrl: t.retweetOf.imageUrl,
          createdAt: t.retweetOf.createdAt.toISOString(),
          user: {
            id: t.retweetOf.user.id,
            email: t.retweetOf.user.email ?? '',
            username: t.retweetOf.user.username,
            displayName: t.retweetOf.user.displayName,
            avatar: t.retweetOf.user.avatar,
          }
        };
      }

      return baseTweet;
    });

    return NextResponse.json({ 
      success: true, 
      tweets: mapped,
      nextCursor: bookmarks.length === 20 ? bookmarks[19].id : null
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
