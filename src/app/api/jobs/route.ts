import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getErrorMessage } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    const jobs = await prisma.jobListing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        poster: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to fetch jobs') }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to post a job' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.subscription !== 'GOLD') {
      return NextResponse.json({ error: 'Only GOLD members can post jobs' }, { status: 403 });
    }

    const { title, company, location, description, salaryRange, url } = await req.json();

    if (!title || !company || !description) {
      return NextResponse.json({ error: 'Title, company, and description are required' }, { status: 400 });
    }

    const job = await prisma.jobListing.create({
      data: {
        posterId: session.userId,
        title,
        company,
        location,
        description,
        salaryRange,
        url,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to post job') }, { status: 500 });
  }
}
