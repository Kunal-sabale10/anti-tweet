import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tweet = await prisma.tweet.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: tweet.viewCount });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
