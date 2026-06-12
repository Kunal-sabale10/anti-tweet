export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import { configureCloudinary } from '@/lib/cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized — please log in first.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided. Please select an image.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" not allowed. Use JPEG, PNG, WebP, or GIF.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let avatarUrl: string;

    const hasCloudinary = !!(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );

    if (hasCloudinary) {
      const cloudinary = await configureCloudinary();
      const base64 = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'anti_tweet_avatars',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      avatarUrl = result.secure_url;
    } else {
      // Local dev fallback — dynamic import prevents EROFS on Vercel
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
      const filename = `${session.userId}.${ext}`;
      const dir = join(process.cwd(), 'public', 'avatars');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, filename), buffer);
      avatarUrl = `/avatars/${filename}?t=${Date.now()}`;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Upload failed. Please try again.') },
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
