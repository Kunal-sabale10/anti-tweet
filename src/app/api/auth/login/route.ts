export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { UAParser } from 'ua-parser-js';
import prisma from '@/lib/prisma';
import { signToken, setSessionCookie } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    // Environmental Checks
    const userAgentStr = req.headers.get('user-agent') || '';
    const parser = new UAParser(userAgentStr);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserType = browser.name || 'Unknown';
    const osType = os.name || 'Unknown';
    const deviceCat = device.type || 'desktop';
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Mobile Time Restriction
    if (deviceCat === 'mobile') {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const istHour = istTime.getUTCHours();
      if (istHour < 10 || istHour >= 13) {
        return NextResponse.json({ error: 'Mobile login is only permitted between 10:00 AM and 1:00 PM IST.' }, { status: 403 });
      }
    }

    // Chrome OTP Enforcement
    const isChrome = browserType.toLowerCase().includes('chrome') && !browserType.toLowerCase().includes('edge');
    
    if (isChrome) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.oTPRequest.create({
        data: {
          userId: user.id,
          code: otp,
          type: 'LOGIN',
          method: 'EMAIL',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });
      console.log(`[MOCK EMAIL] Sent Login OTP ${otp} to ${user.email} (Chrome detected)`);
      return NextResponse.json({ success: true, requiresOtp: true, message: 'OTP sent to email.', mockOtp: otp, userId: user.id });
    }

    // Standard Login
    await prisma.loginSession.create({
      data: {
        userId: user.id,
        browserType,
        os: osType,
        deviceCat,
        ipAddress
      }
    });

    const token = signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ success: true, redirect: '/dashboard' });
    setSessionCookie(response, token);

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
