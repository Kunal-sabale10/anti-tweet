import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tweetId } = await params;

    const existing = await prisma.retweet.findUnique({
      where: { userId_tweetId: { userId: session.userId, tweetId } }
    });

    if (existing) {
      await prisma.retweet.delete({ where: { id: existing.id } });
      const count = await prisma.retweet.count({ where: { tweetId } });
      return NextResponse.json({ retweetedByMe: false, retweetCount: count });
    } else {
      await prisma.retweet.create({
        data: { userId: session.userId, tweetId }
      });
      const count = await prisma.retweet.count({ where: { tweetId } });

      // Create notification
      const tweet = await prisma.tweet.findUnique({ where: { id: tweetId }, select: { userId: true } });
      if (tweet && tweet.userId !== session.userId) {
        await prisma.notification.create({
          data: {
            type: 'RETWEET',
            toUserId: tweet.userId,
            fromUserId: session.userId,
            tweetId: tweetId,
          }
        });
      }

      return NextResponse.json({ retweetedByMe: true, retweetCount: count });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
