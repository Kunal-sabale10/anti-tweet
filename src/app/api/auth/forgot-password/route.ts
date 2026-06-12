export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://anti-tweet.vercel.app';

function getMailTransporter() {
  // Gmail SMTP with App Password (set GMAIL_USER + GMAIL_APP_PASSWORD in Vercel)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  // Fallback: log to console (dev only)
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, lastPasswordResetAt: true }
    });

    if (!user) {
      // Don't reveal if account exists
      return NextResponse.json({ success: true });
    }

    // Rate limit: 1 reset per 15 minutes
    if (user.lastPasswordResetAt) {
      const minsAgo = (Date.now() - new Date(user.lastPasswordResetAt).getTime()) / 60000;
      if (minsAgo < 15) {
        return NextResponse.json({
          error: `Please wait ${Math.ceil(15 - minsAgo)} more minutes before requesting another reset.`
        }, { status: 429 });
      }
    }

    // Generate a short-lived reset token (15 min expiry)
    const token = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    // Update lastPasswordResetAt to start the rate-limit window
    await prisma.user.update({
      where: { id: user.id },
      data: { lastPasswordResetAt: new Date() }
    });

    const transporter = getMailTransporter();

    if (transporter) {
      await transporter.sendMail({
        from: `"Anti-Tweet" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Reset your Anti-Tweet password',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:16px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="font-size:2rem;font-weight:900;color:#3b82f6;letter-spacing:-1px">Anti-Tweet</div>
            </div>
            <h2 style="font-size:1.4rem;font-weight:700;margin:0 0 8px">Reset your password</h2>
            <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6">
              Someone (hopefully you) requested a password reset for <strong style="color:#e2e8f0">${email}</strong>.
              Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
            </p>
            <a href="${resetUrl}" style="display:block;text-align:center;padding:14px 24px;background:#3b82f6;color:#fff;border-radius:9999px;font-weight:700;font-size:1rem;text-decoration:none;margin-bottom:24px">
              Reset Password
            </a>
            <p style="color:#64748b;font-size:0.8rem;text-align:center;margin:0">
              If you didn't request this, you can safely ignore this email.<br>
              This link can only be used once and expires in 15 minutes.
            </p>
          </div>
        `,
      });
    } else {
      // Dev fallback — log to Vercel console
      console.log('\n============== PASSWORD RESET ==============');
      console.log(`Email: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('============================================\n');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Something went wrong. Please try again.') },
      { status: 500 }
    );
  }
}
