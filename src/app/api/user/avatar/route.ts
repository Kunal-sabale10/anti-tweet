export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';

/**
 * POST /api/user/avatar
 * Body: { avatarUrl: string }  ← URL returned by Cloudinary after direct upload
 *
 * The browser uploads directly to Cloudinary using a signed signature
 * from /api/upload/signature, then sends us the resulting secure_url.
 * This route just validates & saves it to the database.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { avatarUrl?: string };
    const { avatarUrl } = body;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'No avatar URL provided' }, { status: 400 });
    }

    // Only accept Cloudinary URLs or local /avatars/ paths
    const isCloudinary = avatarUrl.startsWith('https://res.cloudinary.com/');
    const isLocal = avatarUrl.startsWith('/avatars/');

    if (!isCloudinary && !isLocal) {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('Avatar save error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to save avatar') },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to remove photo') },
      { status: 500 }
    );
  }
}
