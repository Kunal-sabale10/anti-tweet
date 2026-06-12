export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { getErrorMessage } from '@/lib/errors';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      phone: true,
      language: true,
      notificationPref: true,
      subscription: true,
      username: true,
      displayName: true,
      bio: true,
      dmPrivacy: true,
      tweetPrivacy: true,
    }
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { email, phone, password, language, notificationPref, otp, username, displayName, bio, dmPrivacy, tweetPrivacy } = body;

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updateData: Prisma.UserUpdateInput = {};
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (notificationPref !== undefined) updateData.notificationPref = notificationPref;
    if (displayName !== undefined) updateData.displayName = displayName || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (dmPrivacy) updateData.dmPrivacy = dmPrivacy;
    if (tweetPrivacy) updateData.tweetPrivacy = tweetPrivacy;

    // Username: ensure uniqueness
    if (username !== undefined && username !== '') {
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: session.userId } }
      });
      if (existing) {
        return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
      }
      updateData.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }

    // Language Change with OTP verification
    if (language && language !== currentUser.language) {
      if (!otp) {
        return NextResponse.json({ error: 'OTP required for language change' }, { status: 400 });
      }

      const otpRequest = await prisma.oTPRequest.findFirst({
        where: {
          userId: session.userId,
          code: otp,
          type: 'LANGUAGE',
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRequest) {
        return NextResponse.json({ error: 'Invalid or expired language authorization code.' }, { status: 403 });
      }

      updateData.language = language;
      // Delete the used OTP
      await prisma.oTPRequest.delete({ where: { id: otpRequest.id } });
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
      updateData.lastPasswordResetAt = new Date();
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update settings') },
      { status: 500 }
    );
  }
}
