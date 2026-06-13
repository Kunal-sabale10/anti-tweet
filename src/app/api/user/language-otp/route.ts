export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendOTP } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { language } = await req.json();
    if (!language) return NextResponse.json({ error: 'Language required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.oTPRequest.create({
      data: {
        code: otpCode,
        expiresAt,
        type: 'LANGUAGE',
        method: language === 'FR' ? 'EMAIL' : 'PHONE',
        userId: user.id,
      }
    });

    let message = '';
    let mockSmsCode = otpCode; // Always return it for testing purposes

    if (language === 'FR') {
      // Send to email for French
      if (user.email) {
        try {
          await sendOTP(user.email, otpCode);
        } catch (e) {
          console.error("Failed to send email", e);
        }
        message = `OTP sent securely to your registered email address. For testing: ${otpCode}`;
      } else {
        return NextResponse.json({ error: 'No email registered to send OTP.' }, { status: 400 });
      }
    } else {
      // "Send" to phone for others
      if (!user.phone) {
        message = `Simulated SMS sent to mobile (Phone not registered). For testing, your OTP is: ${otpCode}`;
      } else {
        message = `Simulated SMS sent to ${user.phone}. For testing, your OTP is: ${otpCode}`;
      }
    }

    return NextResponse.json({ success: true, message, mockSmsCode });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
