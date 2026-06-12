import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { UAParser } from 'ua-parser-js';
import prisma from '@/lib/prisma';
import { signToken, setCookie } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { sendOTP } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Environmental Checks
    const userAgentStr = req.headers.get('user-agent') || '';
    const parser = new UAParser(userAgentStr);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserType = browser.name || 'Unknown';
    const osType = os.name || 'Unknown';
    const deviceCat = device.type || 'desktop'; // ua-parser returns undefined for desktop usually
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Mobile Time Restriction (10 AM to 1 PM IST)
    if (deviceCat === 'mobile') {
      // Get current time in IST
      const now = new Date();
      const istOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false } as const;
      const istHour = parseInt(new Intl.DateTimeFormat('en-US', istOptions).format(now));

      if (istHour < 10 || istHour >= 13) {
        return NextResponse.json({ error: 'Mobile login is only allowed between 10:00 AM and 1:00 PM IST.' }, { status: 403 });
      }
    }

    // 2. Browser logic
    // Disabled OTP check temporarily because mock email only logs to server console, blocking actual users
    /*
    if (browserType.includes('Chrome')) {
      // Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save OTP into DB
      await prisma.oTPRequest.create({
        data: {
          code,
          userId: user.id,
          type: 'LOGIN',
          method: 'EMAIL',
          expiresAt: new Date(Date.now() + 10 * 60000) // 10 mins
        }
      });

      await sendOTP(user.email || '', code);

      return NextResponse.json({ 
        requiresOtp: true, 
        userId: user.id,
        sessionData: { browserType, osType, deviceCat, ipAddress }
      });
    }
    */

    // Bypass OTP and log in natively.
    await prisma.loginSession.create({
      data: {
        userId: user.id,
        browserType,
        os: osType,
        deviceCat,
        ipAddress
      }
    });

    const token = await signToken({ userId: user.id, email: user.email });
    await setCookie(token);

    return NextResponse.json({ success: true, redirect: '/dashboard' });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
