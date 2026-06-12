export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

// GET /api/users/[id]/mute — check if current user has muted this user
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: mutedId } = await params;

    const existing = await prisma.mute.findUnique({
      where: { muterId_mutedId: { muterId: session.userId, mutedId } },
    });

    return NextResponse.json({ muted: !!existing });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/users/[id]/mute — toggle mute/unmute a user
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: mutedId } = await params;

    if (mutedId === session.userId) {
      return NextResponse.json({ error: 'Cannot mute yourself' }, { status: 400 });
    }

    const existing = await prisma.mute.findUnique({
      where: { muterId_mutedId: { muterId: session.userId, mutedId } },
    });

    if (existing) {
      await prisma.mute.delete({ where: { id: existing.id } });
      return NextResponse.json({ muted: false });
    } else {
      await prisma.mute.create({
        data: { muterId: session.userId, mutedId },
      });
      return NextResponse.json({ muted: true });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
