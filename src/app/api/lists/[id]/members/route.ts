export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: listId } = await params;

    const body = await req.json();
    const { userId } = body as { userId: string };

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify list exists and belongs to session user
    const list = await prisma.userList.findUnique({
      where: { id: listId },
      select: { ownerId: true },
    });

    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    if (list.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Toggle: remove if already a member, add if not
    const existing = await prisma.userListMember.findUnique({
      where: { listId_userId: { listId, userId } },
    });

    if (existing) {
      await prisma.userListMember.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, added: false });
    }

    await prisma.userListMember.create({
      data: { listId, userId },
    });

    return NextResponse.json({ success: true, added: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
