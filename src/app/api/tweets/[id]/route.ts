import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;

    const tweet = await prisma.tweet.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true } },
        likes: session
          ? { where: { userId: session.userId }, select: { id: true } }
          : { take: 0, select: { id: true } },
        tweetRetweets: session
          ? { where: { userId: session.userId }, select: { id: true } }
          : { take: 0, select: { id: true } },
        bookmarks: session
          ? { where: { userId: session.userId }, select: { id: true } }
          : { take: 0, select: { id: true } },
        retweetOf: {
          include: { user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } } }
        },
        replies: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } }
          }
        }
      }
    });

    if (!tweet) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Increment view count (fire-and-forget, do not block response)
    prisma.tweet.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => { /* ignore */ });

    // Fetch poll separately to include votes for myVote resolution
    const poll = await prisma.poll.findUnique({
      where: { tweetId: id },
      include: {
        options: { select: { id: true, text: true, voteCount: true } },
        votes: session
          ? { where: { userId: session.userId }, select: { pollOptionId: true, userId: true } }
          : { take: 0, select: { pollOptionId: true, userId: true } },
      },
    });

    const pollData = poll
      ? {
          id: poll.id,
          expiresAt: poll.expiresAt,
          options: poll.options.map((o) => ({
            id: o.id,
            text: o.text,
            voteCount: o.voteCount,
          })),
          myVote: session
            ? poll.votes.find((v) => v.userId === session.userId)?.pollOptionId ?? null
            : null,
          totalVotes: poll.votes.length,
        }
      : null;

    const baseTweet = {
      id: tweet.id,
      content: tweet.content,
      audioUrl: tweet.audioUrl,
      imageUrl: tweet.imageUrl,
      createdAt: tweet.createdAt.toISOString(),
      likeCount: tweet._count.likes,
      replyCount: tweet._count.replies,
      retweetCount: tweet._count.tweetRetweets,
      bookmarkCount: tweet._count.bookmarks,
      likedByMe: tweet.likes.length > 0,
      retweetedByMe: tweet.tweetRetweets.length > 0,
      bookmarkedByMe: tweet.bookmarks.length > 0,
      isFollowersOnly: false,
      isQuote: tweet.isQuote,
      retweetOfId: tweet.retweetOfId,
      poll: pollData,
      user: {
        id: tweet.user.id,
        email: tweet.user.email ?? '',
        username: tweet.user.username,
        displayName: tweet.user.displayName,
        avatar: tweet.user.avatar,
      },
      replies: tweet.replies.map(r => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        user: {
          id: r.user.id,
          email: r.user.email ?? '',
          username: r.user.username,
          displayName: r.user.displayName,
          avatar: r.user.avatar,
        }
      }))
    };

    if (tweet.retweetOf) {
      (baseTweet as any).retweetOf = {
        id: tweet.retweetOf.id,
        content: tweet.retweetOf.content,
        audioUrl: tweet.retweetOf.audioUrl,
        imageUrl: tweet.retweetOf.imageUrl,
        createdAt: tweet.retweetOf.createdAt.toISOString(),
        user: {
          id: tweet.retweetOf.user.id,
          email: tweet.retweetOf.user.email ?? '',
          username: tweet.retweetOf.user.username,
          displayName: tweet.retweetOf.user.displayName,
          avatar: tweet.retweetOf.user.avatar,
        }
      };
    }

    return NextResponse.json({ success: true, tweet: baseTweet });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Fetch tweet with owner's subscription info
    const tweet = await prisma.tweet.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, subscription: true } },
      },
    });

    if (!tweet) return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    if (tweet.userId !== session.userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Only SILVER (Blue) or GOLD subscribers may edit tweets
    const editableSubscriptions = ['SILVER', 'GOLD'];
    if (!editableSubscriptions.includes(tweet.user.subscription)) {
      return NextResponse.json(
        { error: 'Tweet editing requires a Blue or Gold subscription' },
        { status: 403 }
      );
    }

    // Tweets may only be edited within 1 hour of posting
    const ONE_HOUR_MS = 60 * 60 * 1000;
    if (Date.now() - new Date(tweet.createdAt).getTime() > ONE_HOUR_MS) {
      return NextResponse.json(
        { error: 'Tweets can only be edited within 1 hour of posting' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { content?: string };
    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const updated = await prisma.tweet.update({
      where: { id },
      data: { content: body.content.trim() },
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true } },
      },
    });

    return NextResponse.json({
      success: true,
      tweet: {
        id: updated.id,
        content: updated.content,
        audioUrl: updated.audioUrl,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt.toISOString(),
        likeCount: updated._count.likes,
        replyCount: updated._count.replies,
        retweetCount: updated._count.tweetRetweets,
        bookmarkCount: updated._count.bookmarks,
        user: {
          id: updated.user.id,
          email: updated.user.email ?? '',
          username: updated.user.username,
          displayName: updated.user.displayName,
          avatar: updated.user.avatar,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const tweet = await prisma.tweet.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!tweet) return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    if (tweet.userId !== session.userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.tweet.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
