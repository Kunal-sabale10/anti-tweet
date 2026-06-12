export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: creatorId } = await params;

    if (creatorId === session.userId) {
      return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 });
    }

    const existing = await prisma.creatorSubscription.findUnique({
      where: { followerId_creatorId: { followerId: session.userId, creatorId } }
    });

    if (existing) {
      // Unsubscribe
      await prisma.creatorSubscription.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ subscribed: false });
    } else {
      // Subscribe (Simulate successful payment for $5)
      await prisma.creatorSubscription.create({
        data: {
          followerId: session.userId,
          creatorId
        }
      });
      return NextResponse.json({ subscribed: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
