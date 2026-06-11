import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const getCachedTrends = unstable_cache(
  async () => {
    return await prisma.hashtag.findMany({
      orderBy: { count: 'desc' },
      take: 5
    });
  },
  ['global-trends'],
  { revalidate: 60 }
);

export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`retry: 10000\n\n`);

      const interval = setInterval(async () => {
        try {
          const hashtags = await getCachedTrends();

          if (hashtags.length > 0) {
            controller.enqueue(`data: ${JSON.stringify({ type: 'trends', trends: hashtags })}\n\n`);
          } else {
            controller.enqueue(`data: {"type":"ping"}\n\n`);
          }
        } catch (error) {
          // ignore
        }
      }, 60000); // Check every 60 seconds

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
