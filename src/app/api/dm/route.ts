export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

// GET /api/dm — list conversations
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: session.userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, email: true, username: true, displayName: true, avatar: true }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            }
          }
        }
      }
    });

    const conversations = participations.map(p => {
      const otherParticipant = p.conversation.participants.find(
        pp => pp.userId !== session.userId
      );
      const lastMsg = p.conversation.messages[0] || null;
      return {
        id: p.conversation.id,
        otherUser: otherParticipant?.user ?? null,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.createdAt.toISOString(),
          senderId: lastMsg.senderId,
        } : null,
        unreadCount: 0, // simplified
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/dm — create or find conversation with a user
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await req.json();

    if (targetUserId === session.userId) {
      return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 });
    }

    // Check target user DM privacy
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        dmPrivacy: true,
        followers: { where: { followerId: session.userId }, select: { id: true } }
      }
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.dmPrivacy === 'FOLLOWERS' && targetUser.followers.length === 0) {
      return NextResponse.json({
        error: 'This user only accepts DMs from followers.'
      }, { status: 403 });
    }

    // Find existing conversation
    const existing = await prisma.conversationParticipant.findFirst({
      where: {
        userId: session.userId,
        conversation: {
          participants: { some: { userId: targetUserId } }
        }
      },
      include: { conversation: true }
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.conversationId });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: session.userId },
            { userId: targetUserId }
          ]
        }
      }
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
