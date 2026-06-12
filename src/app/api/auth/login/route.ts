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

    // NOTE: Mobile time restriction removed — was blocking 87% of mobile usage hours.

    // Create login session record
    await prisma.loginSession.create({
      data: {
        userId: user.id,
        browserType,
        os: osType,
        deviceCat,
        ipAddress
      }
    });

    // Sign JWT and set cookie DIRECTLY on the response object
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
