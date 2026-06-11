import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

// POST /api/users/[id]/follow — toggle follow
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: targetId } = await params;

    if (targetId === session.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.userId, followingId: targetId } }
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      const count = await prisma.follow.count({ where: { followingId: targetId } });
      return NextResponse.json({ following: false, followerCount: count });
    } else {
      await prisma.follow.create({
        data: { followerId: session.userId, followingId: targetId }
      });
      const count = await prisma.follow.count({ where: { followingId: targetId } });

      await prisma.notification.create({
        data: {
          type: 'FOLLOW',
          toUserId: targetId,
          fromUserId: session.userId,
        }
      });

      return NextResponse.json({ following: true, followerCount: count });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
