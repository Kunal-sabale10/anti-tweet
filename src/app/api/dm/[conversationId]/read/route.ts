import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import eventEmitter from '@/lib/events';

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { messageIds } = await req.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Missing messageIds' }, { status: 400 });
    }

    const now = new Date();
    await prisma.message.updateMany({
      where: { id: { in: messageIds }, conversationId, senderId: { not: session.userId } },
      data: { readAt: now }
    });

    eventEmitter.emit('dm:event', {
      type: 'read',
      conversationId,
      messageIds,
      readAt: now.toISOString(),
      readBy: session.userId
    });

    return NextResponse.json({ success: true, readAt: now.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
