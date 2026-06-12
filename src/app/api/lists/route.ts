export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lists = await prisma.userList.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true } },
      },
    });

    const mapped = lists.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      isPrivate: l.isPrivate,
      createdAt: l.createdAt.toISOString(),
      memberCount: l._count.members,
    }));

    return NextResponse.json({ success: true, lists: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, description, isPrivate } = body as {
      name: string;
      description?: string;
      isPrivate?: boolean;
    };

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    const list = await prisma.userList.create({
      data: {
        ownerId: session.userId,
        name: name.trim(),
        description: description?.trim() ?? null,
        isPrivate: isPrivate ?? false,
      },
    });

    return NextResponse.json({ success: true, list }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
