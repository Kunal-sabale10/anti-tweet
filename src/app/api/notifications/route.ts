import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { toUserId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        fromUser: { select: { id: true, email: true, username: true, displayName: true, avatar: true } }
      }
    });

    const mapped = notifications.map(n => ({
      id: n.id,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      tweetId: n.tweetId,
      previewText: n.previewText,
      fromUser: {
        id: n.fromUser.id,
        email: n.fromUser.email ?? '',
        username: n.fromUser.username,
        displayName: n.fromUser.displayName,
        avatar: n.fromUser.avatar,
      }
    }));

    return NextResponse.json({ success: true, notifications: mapped });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
