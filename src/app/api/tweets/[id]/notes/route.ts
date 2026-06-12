export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notes = await prisma.communityNote.findMany({
      where: { tweetId: id, status: 'APPROVED' },
      include: {
        author: { select: { displayName: true, username: true } }
      },
      orderBy: { helpfulCount: 'desc' }
    });
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();

    if (!content?.trim() || content.length < 10) {
      return NextResponse.json({ error: 'Note must be at least 10 characters long.' }, { status: 400 });
    }

    // Check if user is eligible (must be premium for our clone features)
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.subscription === 'FREE') {
      return NextResponse.json({ error: 'Only Premium subscribers can write Community Notes.' }, { status: 403 });
    }

    const note = await prisma.communityNote.create({
      data: {
        tweetId: id,
        authorId: user.id,
        content,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
