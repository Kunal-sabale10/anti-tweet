export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, phone, password, language } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        subscription: 'FREE', // Always FREE — never trust client-supplied subscription tier
        language: language || 'EN',
      }
    });

    // Auto log-in on register — set cookie directly on response
    const token = signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({
      success: true,
      redirect: '/dashboard',
    });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
