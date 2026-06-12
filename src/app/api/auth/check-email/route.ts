export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/check-email
 * Body: { email: string }
 * Returns: { exists: boolean }
 *
 * Used by the login page to determine if an account exists for
 * a given email — matching the Twitter/X login flow.
 * Does NOT reveal password hashes or any other sensitive data.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json() as { email?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate basic email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user exists — select only the id to minimize data exposure
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error('check-email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
