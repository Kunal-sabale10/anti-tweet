import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

/**
 * GET /api/tweets/[id]/analytics
 *
 * Returns engagement analytics for a specific tweet.
 * Only the tweet's author may access this endpoint.
 *
 * Response shape:
 * {
 *   analytics: {
 *     impressions:      number,   // estimated based on viewCount
 *     engagements:      number,   // likes + replies + retweets
 *     profileClicks:    number,   // ~8% of views
 *     linkClicks:       number,   // ~5% of views if link preview present
 *     likeCount:        number,
 *     replyCount:       number,
 *     retweetCount:     number,
 *     bookmarkCount:    number,
 *     engagementRate:   string,   // percentage formatted to 2 dp
 *   }
 * }
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const tweet = await prisma.tweet.findUnique({
      where: { id },
      select: {
        userId: true,
        viewCount: true,
        linkPreviewUrl: true,
        _count: {
          select: {
            likes: true,
            replies: true,
            tweetRetweets: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!tweet) return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    if (tweet.userId !== session.userId)
      return NextResponse.json({ error: 'Forbidden – only the author can view analytics' }, { status: 403 });

    const { viewCount, linkPreviewUrl, _count } = tweet;

    const impressions    = viewCount * 12;
    const engagements    = _count.likes + _count.replies + _count.tweetRetweets;
    const profileClicks  = Math.floor(viewCount * 0.08);
    const linkClicks     = linkPreviewUrl ? Math.floor(viewCount * 0.05) : 0;

    // Engagement rate = (likes + replies + retweets + bookmarks) / impressions * 100
    const totalEngagements = _count.likes + _count.replies + _count.tweetRetweets + _count.bookmarks;
    const engagementRate =
      impressions > 0
        ? ((totalEngagements / impressions) * 100).toFixed(2) + '%'
        : '0.00%';

    return NextResponse.json({
      analytics: {
        impressions,
        engagements,
        profileClicks,
        linkClicks,
        likeCount:     _count.likes,
        replyCount:    _count.replies,
        retweetCount:  _count.tweetRetweets,
        bookmarkCount: _count.bookmarks,
        engagementRate,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
