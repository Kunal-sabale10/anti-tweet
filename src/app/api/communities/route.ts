import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    // Return all communities, optionally flag if user is a member
    const communities = await prisma.community.findMany({
      include: {
        _count: { select: { members: true } },
        members: session ? { where: { userId: session.userId } } : false
      },
      orderBy: { members: { _count: 'desc' } }
    });

    const mapped = communities.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount: c._count.members,
      isMember: c.members?.length > 0
    }));

    return NextResponse.json({ communities: mapped });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const community = await prisma.$transaction(async (tx) => {
      const comm = await tx.community.create({
        data: {
          name,
          description,
          ownerId: session.userId
        }
      });

      await tx.communityMember.create({
        data: {
          communityId: comm.id,
          userId: session.userId,
          role: 'ADMIN'
        }
      });

      return comm;
    });

    return NextResponse.json({ success: true, community });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
