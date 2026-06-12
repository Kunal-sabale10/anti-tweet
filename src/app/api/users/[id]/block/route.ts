export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

// GET /api/users/[id]/block — check if current user has blocked this user
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: blockedId } = await params;

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: session.userId, blockedId } },
    });

    return NextResponse.json({ blocked: !!existing });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/users/[id]/block — toggle block/unblock a user
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: blockedId } = await params;

    if (blockedId === session.userId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: session.userId, blockedId } },
    });

    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return NextResponse.json({ blocked: false });
    } else {
      await prisma.block.create({
        data: { blockerId: session.userId, blockedId },
      });
      return NextResponse.json({ blocked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
