import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { enable } = await request.json();

    await prisma.user.update({
      where: { id: session.userId },
      data: { twoFactorEnabled: !!enable },
    });

    return NextResponse.json({ success: true, twoFactorEnabled: !!enable });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
