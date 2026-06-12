export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Lazy-load cloudinary only when needed (avoids build-time issues)
async function uploadToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary');

  // Parse CLOUDINARY_URL manually if not auto-parsed
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    throw new Error('CLOUDINARY_URL environment variable is not set');
  }

  // Parse: cloudinary://api_key:api_secret@cloud_name
  const match = cloudinaryUrl.match(/^cloudinary:\/\/(\d+):([^@]+)@(.+)$/);
  if (!match) {
    throw new Error('CLOUDINARY_URL is malformed. Expected: cloudinary://api_key:api_secret@cloud_name');
  }

  cloudinary.config({
    cloud_name: match[3],
    api_key: match[1],
    api_secret: match[2],
    secure: true,
  });

  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'anti_tweet_avatars',
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // auto crop face
      { quality: 'auto', fetch_format: 'auto' }                   // optimise format/size
    ],
  });

  return result.secure_url;
}

// Local fallback for dev (no Cloudinary)
async function saveLocally(buffer: Buffer, userId: string, mimeType: string): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');

  const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
  const filename = `${userId}.${ext}`;
  const avatarDir = join(process.cwd(), 'public', 'avatars');

  await mkdir(avatarDir, { recursive: true });
  await writeFile(join(avatarDir, filename), buffer);

  return `/avatars/${filename}?t=${Date.now()}`;
}

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
        { error: `File type "${file.type}" is not allowed. Use JPEG, PNG, WebP, or GIF.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let avatarUrl: string;

    if (process.env.CLOUDINARY_URL) {
      try {
        avatarUrl = await uploadToCloudinary(buffer, file.type);
      } catch (cloudErr) {
        console.error('Cloudinary upload failed:', cloudErr);
        throw new Error(`Photo upload failed: ${cloudErr instanceof Error ? cloudErr.message : 'Cloudinary error'}`);
      }
    } else {
      // Local dev fallback
      avatarUrl = await saveLocally(buffer, session.userId, file.type);
    }

    // Persist to database
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
    console.error('Avatar remove error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to remove photo') },
      { status: 500 }
    );
  }
}
