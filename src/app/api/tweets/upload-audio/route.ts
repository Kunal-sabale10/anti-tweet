export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';


if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const otp = formData.get('otp') as string;

    if (!file || !otp) {
      return NextResponse.json({ error: 'File and OTP are required' }, { status: 400 });
    }

    // Enforce time window (2 PM to 7 PM IST)
    const now = new Date();
    const istOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' } as const;
    const istHourStr = new Intl.DateTimeFormat('en-US', istOptions).format(now);
    const istHour = parseInt(istHourStr);
    
    if (istHour < 14 || istHour >= 19) {
      return NextResponse.json({ error: 'Audio tweets are only allowed between 2:00 PM and 7:00 PM IST.' }, { status: 403 });
    }

    // 1. Verify OTP
    const otpRequest = await prisma.oTPRequest.findFirst({
      where: {
        userId: session.userId,
        code: otp,
        type: 'AUDIO',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRequest) {
      return NextResponse.json({ error: 'Invalid or expired audio authorization code.' }, { status: 403 });
    }

    // 2. Enforce 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file exceeds 100MB.' }, { status: 413 });
    }

    // 3. Save File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Cloudinary Upload Flow (For Vercel)
    if (process.env.CLOUDINARY_URL) {
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64Data}`;

      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        folder: 'anti_tweet_audio',
        resource_type: 'auto',
      });

      // Delete the used OTP
      await prisma.oTPRequest.delete({ where: { id: otpRequest.id } });

      return NextResponse.json({ success: true, url: uploadResponse.secure_url });
    } else {
      // 2. Local Filesystem Fallback (For local dev)
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      // Ensure directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch {}

      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}.webm`;
      const path = join(uploadDir, filename);
      await writeFile(path, buffer);

      // Delete the used OTP
      await prisma.oTPRequest.delete({ where: { id: otpRequest.id } });

      return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`
      });
    }

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
