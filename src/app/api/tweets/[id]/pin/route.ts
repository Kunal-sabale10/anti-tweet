export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

/**
 * POST /api/tweets/[id]/pin
 *
 * Verifies ownership of the tweet, then returns a pin toggle result.
 * The User schema has no `pinnedTweetId` column, so the pinned state is
 * managed on the client side (localStorage / client state). This endpoint
 * acts as an ownership-gated acknowledgement so the UI can safely trust
 * that only the tweet author can "pin" the tweet.
 *
 * Response: { pinned: boolean, tweetId: string }
 *   - `pinned` is always true on a successful request (client toggles locally)
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Confirm the tweet exists and belongs to the requesting user
    const tweet = await prisma.tweet.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!tweet) return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    if (tweet.userId !== session.userId)
      return NextResponse.json({ error: 'Forbidden – you can only pin your own tweets' }, { status: 403 });

    // Pin state is managed client-side (no schema column available).
    // Return success so the UI can safely persist the pin in localStorage.
    return NextResponse.json({ pinned: true, tweetId: id });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
