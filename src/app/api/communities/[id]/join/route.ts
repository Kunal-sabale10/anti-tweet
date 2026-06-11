import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: session.userId } }
    });

    if (existing) {
      // Leave community
      await prisma.communityMember.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ joined: false });
    } else {
      // Join community
      await prisma.communityMember.create({
        data: {
          communityId: id,
          userId: session.userId
        }
      });
      return NextResponse.json({ joined: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
