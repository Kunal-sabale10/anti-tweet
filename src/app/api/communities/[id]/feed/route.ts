import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;

    const tweets = await prisma.tweet.findMany({
      where: {
        communityId: id,
        replyToId: null // Only fetch top-level tweets
      },
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } },
        likes: session ? { where: { userId: session.userId } } : false,
        tweetRetweets: session ? { where: { userId: session.userId } } : false,
        bookmarks: session ? { where: { userId: session.userId } } : false,
        _count: { select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const mapped = tweets.map(tweet => ({
      id: tweet.id,
      content: tweet.content,
      imageUrl: tweet.imageUrl,
      audioUrl: tweet.audioUrl,
      createdAt: tweet.createdAt.toISOString(),
      likeCount: tweet._count.likes,
      replyCount: tweet._count.replies,
      retweetCount: tweet._count.tweetRetweets,
      bookmarkCount: tweet._count.bookmarks,
      likedByMe: tweet.likes && tweet.likes.length > 0,
      retweetedByMe: tweet.tweetRetweets && tweet.tweetRetweets.length > 0,
      bookmarkedByMe: tweet.bookmarks && tweet.bookmarks.length > 0,
      isFollowersOnly: false, // Community tweets are visible to members
      isSuperFollowersOnly: tweet.isSuperFollowersOnly,
      isArticle: tweet.isArticle,
      articleTitle: tweet.articleTitle,
      user: tweet.user
    }));

    return NextResponse.json({ tweets: mapped });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
