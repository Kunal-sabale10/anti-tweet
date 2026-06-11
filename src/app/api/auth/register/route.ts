import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import { signToken, setCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, phone, password, subscription, language } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
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
        subscription: subscription || 'FREE',
        language: language || 'EN',
      }
    });

    // Auto log-in on register
    const token = await signToken({ userId: user.id, email: user.email });
    await setCookie(token);

    return NextResponse.json({
      success: true,
      userId: user.id,
      redirect: '/dashboard',
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
