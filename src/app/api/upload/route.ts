export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB for tweet images

async function uploadToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary');

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) throw new Error('CLOUDINARY_URL is not set');

  const match = cloudinaryUrl.match(/^cloudinary:\/\/(\d+):([^@]+)@(.+)$/);
  if (!match) throw new Error('CLOUDINARY_URL is malformed');

  cloudinary.config({
    cloud_name: match[3],
    api_key: match[1],
    api_secret: match[2],
    secure: true,
  });

  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'anti_tweet_uploads',
    resource_type: 'image',
    transformation: [
      { width: 1200, crop: 'limit' },         // max 1200px wide
      { quality: 'auto', fetch_format: 'auto' }
    ],
  });

  return result.secure_url;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Use JPEG, PNG, WebP, GIF, or AVIF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (process.env.CLOUDINARY_URL) {
      try {
        const url = await uploadToCloudinary(buffer, file.type);
        return NextResponse.json({ success: true, url });
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        throw new Error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Local fallback for dev only
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await writeFile(join(uploadsDir, filename), buffer);
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
