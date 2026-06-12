export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary globally
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let avatarUrl = '';

    // 1. Cloudinary Upload Flow (For Vercel)
    if (process.env.CLOUDINARY_URL) {
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64Data}`;
      
      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        folder: 'anti_tweet_avatars',
        resource_type: 'auto',
      });
      avatarUrl = uploadResponse.secure_url;
    } else {
      // 2. Local Fallback Flow (For Localhost without Cloudinary)
      const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
      const filename = `${session.userId}.${ext}`;
      const avatarDir = join(process.cwd(), 'public', 'avatars');

      await mkdir(avatarDir, { recursive: true });
      await writeFile(join(avatarDir, filename), buffer);

      avatarUrl = `/avatars/${filename}?t=${Date.now()}`; // cache-bust
    }

    // Save URL to DB
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Upload failed') },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
