export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

// GET /api/tweets/[id]/replies
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tweetId } = await params;

    const replies = await prisma.reply.findMany({
      where: { tweetId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, username: true, displayName: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ replies });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/tweets/[id]/replies
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tweetId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 });
    }

    const reply = await prisma.reply.create({
      data: { content: content.trim(), userId: session.userId, tweetId },
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } }
      }
    });

    const tweet = await prisma.tweet.findUnique({ where: { id: tweetId }, select: { userId: true } });
    if (tweet && tweet.userId !== session.userId) {
      await prisma.notification.create({
        data: {
          type: 'REPLY',
          toUserId: tweet.userId,
          fromUserId: session.userId,
          tweetId: tweetId,
          previewText: content.trim().substring(0, 50),
        }
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
