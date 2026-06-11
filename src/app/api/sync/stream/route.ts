import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  let since = url.searchParams.get('since')
    ? new Date(url.searchParams.get('since')!)
    : new Date(Date.now() - 3000); // start 3s back

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      send({ type: 'connected' });

      const interval = setInterval(async () => {
        try {
          // 1. Fetch new Tweets
          const newTweets = await prisma.tweet.findMany({
            where: {
              createdAt: { gt: since },
              OR: [
                { user: { tweetPrivacy: 'PUBLIC' } },
                { userId: session.userId },
                {
                  user: {
                    tweetPrivacy: 'FOLLOWERS',
                    followers: { some: { followerId: session.userId } }
                  }
                }
              ]
            },
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, email: true, username: true, displayName: true, avatar: true, subscription: true, tweetPrivacy: true } },
              _count: { select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true } },
              likes: { where: { userId: session.userId }, select: { id: true } },
              retweets: { where: { userId: session.userId }, select: { id: true } },
              bookmarks: { where: { userId: session.userId }, select: { id: true } },
            }
          });

          // 2. Fetch new Messages (DMs sent to the user)
          const newMessages = await prisma.message.findMany({
            where: {
              senderId: { not: session.userId },
              conversation: {
                participants: { some: { userId: session.userId } }
              },
              createdAt: { gt: since }
            },
            orderBy: { createdAt: 'asc' }
          });

          // 3. Fetch new Notifications
          const newNotifications = await prisma.notification.findMany({
            where: {
              toUserId: session.userId,
              createdAt: { gt: since }
            },
            include: {
              fromUser: { select: { id: true, email: true, username: true, displayName: true, avatar: true } }
            },
            orderBy: { createdAt: 'asc' }
          });

          let sentEvent = false;

          if (newTweets.length > 0) {
            const mapped = newTweets.map(t => ({
              id: t.id,
              content: t.content,
              audioUrl: t.audioUrl,
              imageUrl: t.imageUrl,
              createdAt: t.createdAt.toISOString(),
              viewCount: t.viewCount,
              likeCount: t._count.likes,
              replyCount: t._count.replies,
              retweetCount: t._count.tweetRetweets,
              bookmarkCount: t._count.bookmarks,
              likedByMe: t.likes.length > 0,
              retweetedByMe: t.retweets.length > 0,
              bookmarkedByMe: t.bookmarks.length > 0,
              isFollowersOnly: t.user.tweetPrivacy === 'FOLLOWERS',
              isQuote: false,
              retweetOfId: null,
              user: {
                id: t.user.id,
                email: t.user.email ?? '',
                username: t.user.username,
                displayName: t.user.displayName,
                avatar: t.user.avatar,
                subscription: t.user.subscription
              }
            }));
            send({ type: 'tweets', tweets: mapped });
            sentEvent = true;
          }

          if (newMessages.length > 0) {
            const mapped = newMessages.map(m => ({
              id: m.id,
              content: m.content,
              senderId: m.senderId,
              createdAt: m.createdAt.toISOString(),
              readAt: m.readAt ? m.readAt.toISOString() : null
            }));
            send({ type: 'messages', messages: mapped });
            sentEvent = true;
          }

          if (newNotifications.length > 0) {
            const mapped = newNotifications.map(n => ({
              id: n.id,
              type: n.type,
              read: n.read,
              createdAt: n.createdAt.toISOString(),
              fromUser: n.fromUser,
              tweetId: n.tweetId,
              previewText: n.previewText
            }));
            send({ type: 'notifications', notifications: mapped });
            sentEvent = true;
          }

          if (sentEvent) {
            since = new Date(); // Update since pointer
          } else {
            send({ type: 'ping' });
          }
        } catch {
          clearInterval(interval);
          try { controller.close(); } catch { /* ignore */ }
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
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
