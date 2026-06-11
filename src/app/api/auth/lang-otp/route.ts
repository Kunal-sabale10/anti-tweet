import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { sendOTP } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { language } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const method = language === 'FR' ? 'EMAIL' : 'PHONE';
    const type = 'LANGUAGE';

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP into DB
    await prisma.oTPRequest.create({
      data: {
        code,
        userId: user.id,
        type,
        method,
        expiresAt: new Date(Date.now() + 10 * 60000)
      }
    });

    if (method === 'EMAIL') {
      await sendOTP(user.email || '', code);
    } else {
      // Mock SMS
      console.log(`\n\n================================`);
      console.log(`📱 MOCK SMS: OTP sent to ${user.phone}`);
      console.log(`📱 YOUR CODE IS: ${code}`);
      console.log(`================================\n\n`);
    }

    return NextResponse.json({ success: true, method });
  } catch (error) {
    console.error('Lang OTP Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
