export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://anti-tweet.vercel.app';

async function sendResetEmail(to: string, resetUrl: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

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
        If you didn't request this, ignore this email — your password won't change.<br>
        Or copy this link: ${resetUrl}
      </p>
    </div>
  `;

  if (gmailUser && gmailPass) {
    // Gmail SMTP with App Password — works for ANY recipient, no domain needed
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
    return;
  }

  // No email config set — print to Vercel logs as fallback
  console.log('\n========= PASSWORD RESET LINK =========');
  console.log(`To: ${to}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('=======================================\n');
}


export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, lastPasswordResetAt: true }
    });

    // Always return success (don't reveal if email exists)
    if (!user || !user.email) {
      return NextResponse.json({ success: true });
    }

    // Rate limit: 1 per 5 minutes
    if (user.lastPasswordResetAt) {
      const minsAgo = (Date.now() - new Date(user.lastPasswordResetAt).getTime()) / 60000;
      if (minsAgo < 5) {
        return NextResponse.json({
          error: `Please wait ${Math.ceil(5 - minsAgo)} more minute(s) before requesting again.`
        }, { status: 429 });
      }
    }

    // Generate JWT reset token (15 min expiry)
    const token = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

    // Send email
    await sendResetEmail(user.email, resetUrl);

    // Record time to enforce rate limit
    await prisma.user.update({
      where: { id: user.id },
      data: { lastPasswordResetAt: new Date() }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Something went wrong. Please try again.') },
      { status: 500 }
    );
  }
}
