import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, noteId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { noteId } = await params;
    const { isHelpful } = await req.json();

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json({ error: 'isHelpful must be a boolean' }, { status: 400 });
    }

    // Check if vote exists
    const existingVote = await prisma.communityNoteVote.findUnique({
      where: { noteId_userId: { noteId, userId: session.userId } }
    });

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this note.' }, { status: 403 });
    }

    // Create vote
    await prisma.communityNoteVote.create({
      data: { noteId, userId: session.userId, isHelpful }
    });

    // Update note counts
    const updateField = isHelpful ? { helpfulCount: { increment: 1 } } : { notHelpfulCount: { increment: 1 } };
    
    const note = await prisma.communityNote.update({
      where: { id: noteId },
      data: updateField
    });

    // Approval threshold logic (3 helpful votes)
    if (note.status === 'PENDING' && note.helpfulCount >= 3) {
      await prisma.communityNote.update({
        where: { id: noteId },
        data: { status: 'APPROVED' }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
