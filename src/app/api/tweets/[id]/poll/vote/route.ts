import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST /api/tweets/[id]/poll/vote — Cast a vote on a poll
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

    const body = await req.json();
    const { pollOptionId } = body as { pollOptionId: string };

    if (!pollOptionId || typeof pollOptionId !== 'string') {
      return NextResponse.json(
        { error: 'pollOptionId is required' },
        { status: 400 }
      );
    }

    // Find the poll for this tweet
    const poll = await prisma.poll.findUnique({
      where: { tweetId },
      select: {
        id: true,
        expiresAt: true,
        options: { select: { id: true } },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'No poll found for this tweet' },
        { status: 404 }
      );
    }

    // Check poll is not expired
    if (new Date() > poll.expiresAt) {
      return NextResponse.json(
        { error: 'This poll has expired' },
        { status: 410 }
      );
    }

    // Verify the chosen option belongs to this poll
    const optionBelongsToPoll = poll.options.some((o) => o.id === pollOptionId);
    if (!optionBelongsToPoll) {
      return NextResponse.json(
        { error: 'Invalid pollOptionId: option does not belong to this poll' },
        { status: 400 }
      );
    }

    // Check if user already voted on this poll (@@unique [userId, pollId])
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        userId_pollId: {
          userId: session.userId,
          pollId: poll.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 409 }
      );
    }

    // Atomically increment voteCount and create the PollVote record
    const [, vote] = await prisma.$transaction([
      prisma.pollOption.update({
        where: { id: pollOptionId },
        data: { voteCount: { increment: 1 } },
      }),
      prisma.pollVote.create({
        data: {
          userId: session.userId,
          pollId: poll.id,
          pollOptionId,
        },
      }),
    ]);

    // Return the updated poll with options and the user's vote info
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: poll.id },
      include: {
        options: {
          select: { id: true, text: true, voteCount: true },
        },
        votes: {
          where: { userId: session.userId },
          select: { pollOptionId: true },
        },
      },
    });

    if (!updatedPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      voteId: vote.id,
      poll: {
        id: updatedPoll.id,
        tweetId: updatedPoll.tweetId,
        expiresAt: updatedPoll.expiresAt.toISOString(),
        createdAt: updatedPoll.createdAt.toISOString(),
        isExpired: new Date() > updatedPoll.expiresAt,
        options: updatedPoll.options,
        votedByMe: true,
        myVotedOptionId: pollOptionId,
      },
    });
  } catch (error) {
    console.error('POST /poll/vote error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
