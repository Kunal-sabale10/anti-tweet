export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function GET(req: Request) {
  try {
    // Only allow cron to trigger this (e.g., using a secret or internal header in production)
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find users who have unread notifications in the past 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const notificationsToProcess = await prisma.notification.findMany({
      where: {
        read: false,
        createdAt: { gte: yesterday }
      },
      include: {
        toUser: { select: { id: true, email: true, displayName: true, notificationPref: true } },
        fromUser: { select: { username: true, displayName: true } }
      }
    });

    if (notificationsToProcess.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No unread notifications to process.' });
    }

    // Group by user
    const userMap = new Map<string, typeof notificationsToProcess>();
    for (const notif of notificationsToProcess) {
      // Respect notification preferences
      if (notif.toUser.notificationPref === false || !notif.toUser.email) continue;
      
      const existing = userMap.get(notif.toUserId) || [];
      existing.push(notif);
      userMap.set(notif.toUserId, existing);
    }

    // Setup Ethereal Transporter
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    let sentCount = 0;

    for (const [userId, notifs] of userMap.entries()) {
      const user = notifs[0].toUser;
      
      let html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">`;
      html += `<h2 style="color: #3b82f6;">Anti-Tweet Digest</h2>`;
      html += `<p>Hi ${user.displayName},</p>`;
      html += `<p>You have ${notifs.length} new unread notifications on Anti-Tweet.</p><ul>`;
      
      notifs.forEach(n => {
        const action = n.type === 'MENTION' ? 'mentioned you' : 
                      n.type === 'QUOTE' ? 'quoted your tweet' : 
                      n.type === 'FOLLOW' ? 'started following you' : 'interacted with you';
        html += `<li style="margin-bottom: 10px;"><strong>@${n.fromUser.username}</strong> ${action}. <br/><span style="color: #94a3b8; font-size: 0.9em;">${n.previewText || ''}</span></li>`;
      });
      
      html += `</ul><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://anti-tweet.vercel.app'}/notifications" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 99px;">View Notifications</a></div>`;

      const info = await transporter.sendMail({
        from: '"Anti-Tweet" <noreply@anti-tweet.com>',
        to: user.email!,
        subject: `You have ${notifs.length} new notifications!`,
        html,
      });

      console.log(`[Digest Email Sent to ${user.email}] Preview URL: %s`, nodemailer.getTestMessageUrl(info));
      
      // Mark as read so we don't spam them again
      await prisma.notification.updateMany({
        where: { id: { in: notifs.map(n => n.id) } },
        data: { read: true }
      });
      
      sentCount++;
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Cron digest error:', error);
    return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 });
  }
}
