export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tweetId } = await params;

    const existing = await prisma.bookmark.findUnique({
      where: { userId_tweetId: { userId: session.userId, tweetId } }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      const count = await prisma.bookmark.count({ where: { tweetId } });
      return NextResponse.json({ bookmarkedByMe: false, bookmarkCount: count });
    } else {
      await prisma.bookmark.create({
        data: { userId: session.userId, tweetId }
      });
      const count = await prisma.bookmark.count({ where: { tweetId } });
      return NextResponse.json({ bookmarkedByMe: true, bookmarkCount: count });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
