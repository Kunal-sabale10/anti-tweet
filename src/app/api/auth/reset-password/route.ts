export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getErrorMessage } from '@/lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { token?: string; password?: string };
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify the JWT token
    let payload: { userId: string; email: string; purpose: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      return NextResponse.json(
        { error: 'This reset link has expired or is invalid. Please request a new one.' },
        { status: 400 }
      );
    }

    if (payload.purpose !== 'password-reset') {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    // Check user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Hash and save the new password
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Reset failed. Please try again.') },
      { status: 500 }
    );
  }
}
