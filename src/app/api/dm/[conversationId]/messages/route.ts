import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/dm/[conversationId]/messages
export async function GET(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;

    // Verify participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.userId } }
    });
    if (!participation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true, email: true } }
      }
    });

    return NextResponse.json({
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
        sender: m.sender,
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/dm/[conversationId]/messages
export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`dm:${session.userId}`, 30, 60 * 1000); // 30 messages per minute
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again in a minute.' }, { status: 429 });
    }

    // Verify participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.userId } }
    });
    if (!participation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.userId,
        content: content.trim()
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true, email: true } }
      }
    });

    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      readAt: null,
      sender: message.sender,
    };

    import('@/lib/events').then(({ default: eventEmitter }) => {
      eventEmitter.emit('dm:event', {
        type: 'messages',
        conversationId,
        messages: [formattedMessage]
      });
    });

    return NextResponse.json({
      message: formattedMessage
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
