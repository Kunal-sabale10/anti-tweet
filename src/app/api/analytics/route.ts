import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        adRevenueBalance: true,
        subscription: true,
        _count: {
          select: {
            followers: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tweets = await prisma.tweet.findMany({
      where: { userId: session.userId },
      select: {
        viewCount: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            replies: true,
            tweetRetweets: true,
          }
        }
      }
    });

    let impressions = 0;
    let engagements = 0;

    // Initialize graph data for last 7 days
    const activityGraph: { name: string; views: number; engagements: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const name = d.toLocaleDateString('en-US', { weekday: 'short' });
      activityGraph.push({ name, views: 0, engagements: 0 });
    }

    for (const tweet of tweets) {
      impressions += tweet.viewCount;
      const tweetEngs = tweet._count.likes + tweet._count.replies + tweet._count.tweetRetweets;
      engagements += tweetEngs;

      // Group by day for the graph
      const tDate = new Date(tweet.createdAt);
      tDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - tDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 7) {
        const index = 6 - diffDays;
        activityGraph[index].views += tweet.viewCount;
        activityGraph[index].engagements += tweetEngs;
      }
    }

    // Mocking profile clicks, or we could just set it to a portion of impressions
    const profileClicks = Math.floor(impressions * 0.15);

    return NextResponse.json({
      impressions,
      engagements,
      profileClicks,
      followerCount: user._count.followers,
      adRevenueBalance: user.adRevenueBalance,
      subscription: user.subscription,
      activityGraph
    });
  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
