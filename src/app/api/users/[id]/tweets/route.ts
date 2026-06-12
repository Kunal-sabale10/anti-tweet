export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/users/[id]/tweets?type=posts|replies|media|likes
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'posts';

    if (type === 'replies') {
      const replies = await prisma.reply.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, content: true, createdAt: true, tweetId: true }
      });
      return NextResponse.json({ tweets: replies });
    }

    if (type === 'media') {
      const tweets = await prisma.tweet.findMany({
        where: { userId: id, imageUrl: { not: null }, replyToId: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, content: true, imageUrl: true, createdAt: true }
      });
      return NextResponse.json({ tweets });
    }

    if (type === 'likes') {
      const likes = await prisma.like.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          tweet: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatar: true, email: true } }
            }
          }
        }
      });
      const tweets = likes.map(l => ({
        id: l.tweet.id,
        content: l.tweet.content,
        createdAt: l.tweet.createdAt.toISOString(),
        user: l.tweet.user
      }));
      return NextResponse.json({ tweets });
    }

    // Default: posts
    const tweets = await prisma.tweet.findMany({
      where: { userId: id, replyToId: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, content: true, audioUrl: true, imageUrl: true, isArticle: true, articleTitle: true, createdAt: true }
    });
    return NextResponse.json({ tweets });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
