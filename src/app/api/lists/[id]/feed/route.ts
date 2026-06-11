import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: listId } = await params;
    const { searchParams } = new URL(_req.url);
    const cursor = searchParams.get('cursor');

    // Verify list exists, respect private access
    const list = await prisma.userList.findUnique({
      where: { id: listId },
      select: { ownerId: true, isPrivate: true },
    });

    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    if (list.isPrivate && list.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Collect all member userIds for this list
    const memberships = await prisma.userListMember.findMany({
      where: { listId },
      select: { userId: true },
    });

    const memberIds = memberships.map((m) => m.userId);

    if (memberIds.length === 0) {
      return NextResponse.json({ success: true, tweets: [], nextCursor: null });
    }

    // Fetch tweets from all members
    const tweets = await prisma.tweet.findMany({
      where: { userId: { in: memberIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            email: true,
          },
        },
        likes: { where: { userId: session.userId }, select: { id: true } },
        tweetRetweets: { where: { userId: session.userId }, select: { id: true } },
        bookmarks: { where: { userId: session.userId }, select: { id: true } },
        _count: {
          select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true },
        },
      },
    });

    const mapped = tweets.map((t) => ({
      id: t.id,
      content: t.content,
      audioUrl: t.audioUrl,
      imageUrl: t.imageUrl,
      createdAt: t.createdAt.toISOString(),
      isQuote: t.isQuote,
      retweetOfId: t.retweetOfId,
      likeCount: t._count.likes,
      replyCount: t._count.replies,
      retweetCount: t._count.tweetRetweets,
      bookmarkCount: t._count.bookmarks,
      likedByMe: t.likes.length > 0,
      retweetedByMe: t.tweetRetweets.length > 0,
      bookmarkedByMe: t.bookmarks.length > 0,
      user: {
        id: t.user.id,
        displayName: t.user.displayName,
        username: t.user.username,
        avatar: t.user.avatar,
        email: t.user.email ?? '',
      },
    }));

    return NextResponse.json({ 
      success: true, 
      tweets: mapped,
      nextCursor: tweets.length === 20 ? tweets[19].id : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
