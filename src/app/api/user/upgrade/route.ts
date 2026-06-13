export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { sendInvoice } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!['FREE', 'BRONZE', 'SILVER', 'GOLD'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // IST Time Check (10:00 AM - 11:00 AM) using reliable UTC math
    const now = new Date();
    const uHr = now.getUTCHours();
    const uMin = now.getUTCMinutes();
    let istMin = uMin + 30;
    let istHr = uHr + 5 + Math.floor(istMin / 60);
    istHr = istHr % 24;

    if (istHr !== 10) {
      return NextResponse.json({ 
        error: `Payments are only processed between 10:00 AM and 11:00 AM IST.` 
      }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: { subscription: plan }
    });

    // Send mock invoice
    const planPrices: Record<string, string> = {
      FREE: '₹0',
      BRONZE: '₹100',
      SILVER: '₹300',
      GOLD: '₹1000'
    };
    
    await sendInvoice(user.email || '', plan, planPrices[plan]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upgrade Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
