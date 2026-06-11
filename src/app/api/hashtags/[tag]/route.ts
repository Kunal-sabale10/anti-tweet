import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const session = await getSession();
    const { tag } = await params;
    
    const { searchParams } = new URL(_req.url);
    const cursor = searchParams.get('cursor');

    const hashtag = await prisma.hashtag.findUnique({
      where: { tag },
    });

    if (!hashtag) {
      return NextResponse.json({ tag, tweetCount: 0, tweets: [], nextCursor: null });
    }

    const hashtagOnTweets = await prisma.hashtagOnTweet.findMany({
      where: { hashtagId: hashtag.id },
      take: 20,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        tweet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            likes: { select: { userId: true } },
            _count: {
              select: {
                likes: true,
                replies: true,
                tweetRetweets: true,
                bookmarks: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tweets = hashtagOnTweets.map(({ tweet }) => ({
      id: tweet.id,
      content: tweet.content,
      audioUrl: tweet.audioUrl,
      imageUrl: tweet.imageUrl,
      createdAt: tweet.createdAt.toISOString(),
      likeCount: tweet._count.likes,
      replyCount: tweet._count.replies,
      retweetCount: tweet._count.tweetRetweets,
      bookmarkCount: tweet._count.bookmarks,
      likedByMe: session
        ? tweet.likes.some((l) => l.userId === session.userId)
        : false,
      retweetedByMe: false,
      bookmarkedByMe: false,
      isFollowersOnly: false,
      isQuote: tweet.isQuote,
      retweetOfId: tweet.retweetOfId,
      retweetOf: null,
      user: {
        id: tweet.user.id,
        email: tweet.user.email ?? '',
        username: tweet.user.username,
        displayName: tweet.user.displayName,
        avatar: tweet.user.avatar,
      },
    }));

    return NextResponse.json({
      tag,
      tweetCount: hashtag.count,
      tweets,
      nextCursor: hashtagOnTweets.length === 20 ? hashtagOnTweets[19].id : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
