import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary globally
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Cloudinary Upload Flow
    if (process.env.CLOUDINARY_URL) {
      // Cloudinary needs a base64 string or stream. We will convert buffer to base64.
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64Data}`;
      
      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        folder: 'anti_tweet_uploads',
        resource_type: 'auto',
      });
      return NextResponse.json({ success: true, url: uploadResponse.secure_url });
    }

    // 2. Local Fallback Flow
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // ignore if exists
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
