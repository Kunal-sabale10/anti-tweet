import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import eventEmitter from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { conversationId } = await params;

  // Verify participant
  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.userId } }
  });
  if (!participation) return new Response('Forbidden', { status: 403 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      };

      send({ type: 'connected' });

      const listener = (eventData: any) => {
        if (eventData.conversationId === conversationId) {
          send(eventData);
        }
      };

      eventEmitter.on('dm:event', listener);

      // Keepalive ping
      const interval = setInterval(() => {
        send({ type: 'ping' });
      }, 15000);

      req.signal.addEventListener('abort', () => {
        eventEmitter.off('dm:event', listener);
        clearInterval(interval);
        try { controller.close(); } catch { /* ignore */ }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
}
