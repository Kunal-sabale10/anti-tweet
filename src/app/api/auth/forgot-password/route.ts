export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://anti-tweet.vercel.app';

async function trySendEmail(to: string, resetUrl: string): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailPass) return false;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f1117;color:#e2e8f0;border-radius:16px;border:1px solid rgba(255,255,255,0.08)">
      <div style="text-align:center;margin-bottom:28px">
        <span style="font-size:2rem;font-weight:900;color:#3b82f6;letter-spacing:-1px">Anti-Tweet</span>
      </div>
      <h2 style="font-size:1.4rem;font-weight:700;margin:0 0 10px;color:#f1f5f9">Reset your password</h2>
      <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;font-size:0.95rem">
        We received a request to reset the password for <strong style="color:#e2e8f0">${to}</strong>.<br>
        Click the button below — this link expires in <strong style="color:#3b82f6">15 minutes</strong>.
      </p>
      <a href="${resetUrl}"
        style="display:block;text-align:center;padding:14px 24px;background:#3b82f6;color:#fff;border-radius:9999px;font-weight:700;font-size:1rem;text-decoration:none;margin-bottom:24px">
        Reset Password →
      </a>
      <p style="color:#475569;font-size:0.8rem;text-align:center;margin:0;line-height:1.6">
        If you didn't request this, ignore this email — your password won't change.
      </p>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({
      from: `"Anti-Tweet" <${gmailUser}>`,
      to,
      subject: 'Reset your Anti-Tweet password',
      html,
    });
    return true;
  } catch (err) {
    console.error('Gmail send failed:', err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { identifier?: string };
    const identifier = body.identifier?.trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      select: { id: true, email: true, phone: true, lastPasswordResetAt: true }
    });

    // If account doesn't exist — still show success (security: don't reveal existence)
    if (!user) {
      return NextResponse.json({ success: true, emailSent: false });
    }

    // Rate limit: 1 per day (1440 minutes)
    if (user.lastPasswordResetAt) {
      const minsAgo = (Date.now() - new Date(user.lastPasswordResetAt).getTime()) / 60000;
      if (minsAgo < 1440) {
        return NextResponse.json({
          error: 'You can use this option only one time per day.'
        }, { status: 429 });
      }
    }

    // Generate JWT reset token (15 min expiry)
    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

    // Record time (rate limit)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastPasswordResetAt: new Date() }
    });

    // Try sending email if user has an email
    let emailSent = false;
    if (user.email) {
      emailSent = await trySendEmail(user.email, resetUrl);
    }

    if (emailSent) {
      // Email sent — still return URL to help user out in case of delivery issues
      return NextResponse.json({ success: true, emailSent: true, resetUrl });
    }

    // Email not configured or phone used — return the reset URL directly so the user can reset now
    console.log(`[Password Reset] Reset URL for ${identifier}: ${resetUrl}`);
    return NextResponse.json({ success: true, emailSent: false, resetUrl });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Something went wrong. Please try again.') },
      { status: 500 }
    );
  }
}
