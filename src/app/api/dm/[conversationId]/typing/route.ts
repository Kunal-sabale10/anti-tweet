import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import eventEmitter from '@/lib/events';

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { isTyping } = await req.json();

    eventEmitter.emit('dm:event', {
      type: 'typing',
      conversationId,
      userId: session.userId,
      isTyping
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
