export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { sendOTP } from '@/lib/mailer';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.oTPRequest.create({
      data: {
        code,
        userId: user.id,
        type: 'RESET_PASSWORD',
        method: 'EMAIL',
        expiresAt: new Date(Date.now() + 15 * 60000) // 15 mins
      }
    });

    await sendOTP(user.email || '', code);

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Reset Password Request Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to send OTP') },
      { status: 500 }
    );
  }
}
