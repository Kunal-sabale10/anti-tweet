import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, setCookie, signToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import type { LoginSessionData } from '@/lib/types';

interface VerifyOtpRequestBody {
  userId: string;
  code: string;
  sessionData?: LoginSessionData;
  type?: string;
}

export async function POST(req: Request) {
  try {
    const { code, sessionData, type, userId: requestedUserId } =
      (await req.json()) as VerifyOtpRequestBody;
    let userId = requestedUserId;
    const otpType = type ?? 'LOGIN';

    if (!userId || !code) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (userId === 'current') {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = session.userId;
    }

    const otp = await prisma.oTPRequest.findFirst({
      where: {
        userId,
        code,
        type: otpType,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > otp.expiresAt) {
      return NextResponse.json({ error: 'OTP Expired' }, { status: 400 });
    }

    // OTP matched perfectly
    // Mark as used by deleting it
    await prisma.oTPRequest.delete({ where: { id: otp.id } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (otpType === 'LOGIN' && sessionData) {
      await prisma.loginSession.create({
        data: {
          userId: user.id,
          browserType: sessionData.browserType,
          os: sessionData.osType,
          deviceCat: sessionData.deviceCat,
          ipAddress: sessionData.ipAddress,
        },
      });
    }

    if (otpType === 'LOGIN') {
      const token = await signToken({ userId: user.id, email: user.email });
      await setCookie(token);

      return NextResponse.json({ success: true, redirect: '/dashboard' });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
