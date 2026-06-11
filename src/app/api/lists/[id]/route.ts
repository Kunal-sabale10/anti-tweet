import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const list = await prisma.userList.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatar: true,
                email: true,
              },
            },
          },
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    // Private lists are only visible to the owner
    if (list.isPrivate && list.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      list: {
        id: list.id,
        name: list.name,
        description: list.description,
        isPrivate: list.isPrivate,
        createdAt: list.createdAt.toISOString(),
        owner: list.owner,
        members: list.members.map((m) => ({
          id: m.id,
          addedAt: m.addedAt.toISOString(),
          user: m.user,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const list = await prisma.userList.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

    if (list.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.userList.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
