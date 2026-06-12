export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';
import { getTransporter } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Security: Don't reveal if user exists or not, but for this specific task
    // we will follow the instructions carefully.
    if (!user) {
      return NextResponse.json({ success: true }); // Mock success
    }

    // Check last reset (1 per day = 24 hours)
    if (user.lastPasswordResetAt) {
      const lastReset = new Date(user.lastPasswordResetAt).getTime();
      const now = new Date().getTime();
      const diffHours = (now - lastReset) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return NextResponse.json({ 
          error: `You can only request one password reset every 24 hours. Please wait ${Math.ceil(24 - diffHours)} more hours.` 
        }, { status: 429 });
      }
    }

    // Generate random password (Uppercase + Lowercase only, no numbers/specials)
    const generatePassword = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const tempPassword = generatePassword(12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastPasswordResetAt: new Date()
      }
    });

    // Send Email
    console.log(`\n\n================================`);
    console.log(`🔑 MOCK MOCK MOCK: Password Reset for ${email}`);
    console.log(`🔑 NEW PASSWORD: ${tempPassword}`);
    console.log(`================================\n\n`);

    try {
      const transporter = await getTransporter();
      await transporter.sendMail({
        from: '"Anti-Tweet Security" <security@anti-tweet.com>',
        to: email,
        subject: "Your New Temporary Password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h1 style="color: #3b82f6;">Anti-Tweet</h1>
            <hr />
            <h2>New Temporary Password</h2>
            <p>You requested a password reset. Here is your new temporary password:</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 1.5rem; text-align: center; margin: 20px 0; letter-spacing: 2px; font-weight: bold; color: #1e293b;">
              ${tempPassword}
            </div>
            <p>For security reasons, we recommend changing this password immediately after logging in.</p>
            <p style="font-size: 0.8rem; color: #64748b;">
              If you did not request this reset, please contact support immediately.
            </p>
          </div>
        `
      });
    } catch {
      console.log("Mock email transport failed, but password is logged above.");
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
