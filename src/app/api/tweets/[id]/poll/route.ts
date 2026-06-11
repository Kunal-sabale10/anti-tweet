import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper to build poll response shape
async function buildPollResponse(pollId: string, userId?: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        select: {
          id: true,
          text: true,
          voteCount: true,
        },
      },
      votes: userId
        ? { where: { userId }, select: { pollOptionId: true } }
        : false,
    },
  });

  if (!poll) return null;

  const userVote = userId && poll.votes.length > 0 ? poll.votes[0] : null;

  return {
    id: poll.id,
    tweetId: poll.tweetId,
    expiresAt: poll.expiresAt.toISOString(),
    createdAt: poll.createdAt.toISOString(),
    isExpired: new Date() > poll.expiresAt,
    options: poll.options,
    votedByMe: !!userVote,
    myVotedOptionId: userVote?.pollOptionId ?? null,
  };
}

// POST /api/tweets/[id]/poll — Create a poll on an existing tweet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tweetId } = await params;

    // Verify tweet exists and belongs to the current user
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
      select: { id: true, userId: true, poll: { select: { id: true } } },
    });

    if (!tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    }

    if (tweet.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only add polls to your own tweets' },
        { status: 403 }
      );
    }

    if (tweet.poll) {
      return NextResponse.json(
        { error: 'This tweet already has a poll' },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { options, expiresInHours } = body as {
      options: string[];
      expiresInHours: number;
    };

    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      return NextResponse.json(
        { error: 'A poll must have between 2 and 4 options' },
        { status: 400 }
      );
    }

    if (
      typeof expiresInHours !== 'number' ||
      expiresInHours <= 0 ||
      expiresInHours > 168 // max 7 days
    ) {
      return NextResponse.json(
        { error: 'expiresInHours must be a number between 1 and 168' },
        { status: 400 }
      );
    }

    const trimmedOptions = options.map((o) => o?.toString().trim()).filter(Boolean);
    if (trimmedOptions.length !== options.length) {
      return NextResponse.json(
        { error: 'Poll options must be non-empty strings' },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const poll = await prisma.poll.create({
      data: {
        tweetId,
        expiresAt,
        options: {
          create: trimmedOptions.map((text) => ({ text })),
        },
      },
      include: {
        options: {
          select: { id: true, text: true, voteCount: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        poll: {
          id: poll.id,
          tweetId: poll.tweetId,
          expiresAt: poll.expiresAt.toISOString(),
          createdAt: poll.createdAt.toISOString(),
          isExpired: false,
          options: poll.options,
          votedByMe: false,
          myVotedOptionId: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /poll error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET /api/tweets/[id]/poll — Get poll results for a tweet
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(); // optional auth
    const { id: tweetId } = await params;

    const pollRecord = await prisma.poll.findUnique({
      where: { tweetId },
      select: { id: true },
    });

    if (!pollRecord) {
      return NextResponse.json(
        { error: 'No poll found for this tweet' },
        { status: 404 }
      );
    }

    const poll = await buildPollResponse(pollRecord.id, session?.userId);

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, poll });
  } catch (error) {
    console.error('GET /poll error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
