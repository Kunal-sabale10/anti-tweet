import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

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

    // 3. Save File (Mocking a real upload, saving to public/uploads)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
