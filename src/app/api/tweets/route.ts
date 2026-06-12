export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { scrapeUrl } from '@/lib/scraper';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const feed = searchParams.get('feed') || 'foryou'; // 'foryou' | 'following'
    const cursor = searchParams.get('cursor');

    let whereClause: any = {
      AND: [
        { communityId: null },
        {
          OR: [
            { isSuperFollowersOnly: false },
            { userId: session.userId },
            { user: { subscribers: { some: { followerId: session.userId, active: true } } } }
          ]
        },
        {
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
        {
          OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }]
        }
      ]
    };

    // Phase 4: Topics priority for 'foryou' feed
    let userTopics: string[] = [];
    if (feed === 'foryou') {
      const followedTopics = await prisma.userTopic.findMany({
        where: { userId: session.userId },
        include: { topic: true }
      });
      userTopics = followedTopics.map(ut => ut.topic.name.toLowerCase());
    }

    // Get blocked and muted user IDs to exclude from feed
    const [blockedUsers, mutedUsers] = await Promise.all([
      prisma.block.findMany({ where: { blockerId: session.userId }, select: { blockedId: true } }),
      prisma.mute.findMany({ where: { muterId: session.userId }, select: { mutedId: true } }),
    ]);
    const excludedUserIds = [
      ...blockedUsers.map(b => b.blockedId),
      ...mutedUsers.map(m => m.mutedId),
    ];

    if (feed === 'following') {
      whereClause.AND[0] = {
        OR: [
          { userId: session.userId },
          { user: { followers: { some: { followerId: session.userId } } } }
        ]
      };
      if (excludedUserIds.length > 0) {
        whereClause.AND.push({ userId: { notIn: excludedUserIds } });
      }
    } else if (excludedUserIds.length > 0) {
      whereClause.AND.push({ userId: { notIn: excludedUserIds } });
    }

    let orderByClause: any = { createdAt: 'desc' };
    if (feed === 'foryou') {
      orderByClause = [
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ];
      // If user follows topics, try to match keywords in content
      // Note: SQLite doesn't have advanced full-text search without FTS5 setup, 
      // so we'll fetch a larger set and sort it in memory if needed, or just let viewCount dominate.
      // We will stick to Prisma's sorting and handle topics as a bonus if we implement a recommendation engine.
    }

    const tweets = await prisma.tweet.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: 50,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatar: true,
            subscription: true,
          }
        },
        _count: { select: { likes: true, replies: true, tweetRetweets: true, bookmarks: true } },
        likes: { where: { userId: session.userId }, select: { id: true } },
        tweetRetweets: { where: { userId: session.userId }, select: { id: true } },
        bookmarks: { where: { userId: session.userId }, select: { id: true } },
        media: { orderBy: { order: 'asc' } },
        retweetOf: {
          include: {
            user: { select: { id: true, email: true, username: true, displayName: true, avatar: true } }
          }
        }
      }
    });

    const mapped = tweets.map(t => {
      // Build base tweet
      const baseTweet = {
        id: t.id,
        content: t.content,
        audioUrl: t.audioUrl,
        imageUrl: t.imageUrl,
        createdAt: t.createdAt.toISOString(),
        likeCount: t._count.likes,
        replyCount: t._count.replies,
        retweetCount: t._count.tweetRetweets,
        bookmarkCount: t._count.bookmarks,
        likedByMe: t.likes.length > 0,
        retweetedByMe: t.tweetRetweets.length > 0,
        bookmarkedByMe: t.bookmarks.length > 0,
        isFollowersOnly: false,
        isSuperFollowersOnly: t.isSuperFollowersOnly,
        isArticle: t.isArticle,
        articleTitle: t.articleTitle,
        isQuote: t.isQuote,
        retweetOfId: t.retweetOfId,
        viewCount: t.viewCount,
        linkPreviewUrl: t.linkPreviewUrl,
        linkPreviewTitle: t.linkPreviewTitle,
        linkPreviewImg: t.linkPreviewImg,
        linkPreviewDesc: t.linkPreviewDesc,
        media: (t as any).media || [],
        user: {
          id: t.user.id,
          email: t.user.email ?? '',
          username: t.user.username,
          displayName: t.user.displayName,
          avatar: t.user.avatar,
          subscription: t.user.subscription,
        }
      };

      if (t.retweetOf) {
        (baseTweet as any).retweetOf = {
          id: t.retweetOf.id,
          content: t.retweetOf.content,
          audioUrl: t.retweetOf.audioUrl,
          imageUrl: t.retweetOf.imageUrl,
          createdAt: t.retweetOf.createdAt.toISOString(),
          user: {
            id: t.retweetOf.user.id,
            email: t.retweetOf.user.email ?? '',
            username: t.retweetOf.user.username,
            displayName: t.retweetOf.user.displayName,
            avatar: t.retweetOf.user.avatar,
          }
        };
      }

      return baseTweet;
    });

    return NextResponse.json({ 
      success: true, 
      tweets: mapped,
      nextCursor: tweets.length === 50 ? tweets[49].id : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const tweetDataList = Array.isArray(body) ? body : (body.tweets && Array.isArray(body.tweets) ? body.tweets : [body]);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tweets: true }
    });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rateLimit = checkRateLimit(`tweet:${session.userId}`, 20, 60 * 60 * 1000); // 20 per hour
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    let Filter = null;
    try {
      const FilterClass = require('bad-words');
      Filter = new FilterClass();
    } catch { /* ignore if not installed yet */ }

    // Apply profanity filter
    for (const data of tweetDataList) {
      if (data.content && Filter) {
        data.content = Filter.clean(data.content);
      }
    }

    // Subscription Check Constraints
    const totalTweets = user.tweets.length;
    let allowedLimit = 0;

    switch (user.subscription) {
      case 'FREE': allowedLimit = 100; break; // Increased for testing
      case 'BRONZE': allowedLimit = 300; break;
      case 'SILVER': allowedLimit = 500; break;
      case 'GOLD': allowedLimit = Infinity; break;
      default: allowedLimit = 100; break;
    }

    if (totalTweets + tweetDataList.length > allowedLimit) {
      return NextResponse.json({ 
        error: `Tweet limit reached for ${user.subscription} plan. Please upgrade.` 
      }, { status: 403 });
    }

    // Audio Window Check
    const now = new Date();
    const istOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false } as const;
    const istHour = parseInt(new Intl.DateTimeFormat('en-US', istOptions).format(now));

    for (const data of tweetDataList) {
      if (data.audioUrl) {
        if (istHour < 14 || istHour >= 19) {
          return NextResponse.json({ error: 'Audio tweets are only allowed between 2:00 PM and 7:00 PM IST.' }, { status: 403 });
        }
      }
    }

    const createdTweets = [];
    const threadId = tweetDataList.length > 1 ? crypto.randomUUID() : null;
    let previousTweetId = null;

    for (const data of tweetDataList) {
      let linkPreviewUrl = null;
      let linkPreviewTitle = null;
      let linkPreviewImg = null;
      let linkPreviewDesc = null;

      if (data.content) {
        const urlMatch = data.content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const scraped = await scrapeUrl(urlMatch[0]);
          if (scraped) {
            linkPreviewUrl = scraped.url;
            linkPreviewTitle = scraped.title;
            linkPreviewImg = scraped.image;
            linkPreviewDesc = scraped.description;
          }
        }
      }

      const tweet = await prisma.tweet.create({
        data: {
          content: data.content || null,
          audioUrl: data.audioUrl || null,
          imageUrl: data.imageUrl || null,
          communityId: data.communityId || null,
          isSuperFollowersOnly: data.isSuperFollowersOnly || false,
          isArticle: data.isArticle || false,
          articleTitle: data.articleTitle || null,
          linkPreviewUrl,
          linkPreviewTitle,
          linkPreviewImg,
          linkPreviewDesc,
          userId: user.id,
          retweetOfId: data.retweetOfId || null,
          isQuote: data.isQuote || false,
          threadId: threadId,
          replyToId: previousTweetId,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
          media: (data.media && Array.isArray(data.media)) ? {
            create: data.media.map((m: any, idx: number) => ({
              url: m.url,
              type: m.type,
              order: idx
            }))
          } : undefined
        }
      }) as any;
      previousTweetId = tweet.id;
      createdTweets.push(tweet);

      // Parse and process hashtags
      if (data.content) {
        const matches = data.content.match(/#[\w]+/g) || [];
        const tags = Array.from(new Set(matches)).map((t: any) => t.substring(1).toLowerCase());
        for (const tag of tags) {
          const hashtag = await prisma.hashtag.upsert({
            where: { tag },
            update: { count: { increment: 1 } },
            create: { tag, count: 1 }
          });
          await prisma.hashtagOnTweet.create({
            data: { hashtagId: hashtag.id, tweetId: tweet.id }
          });
        }

        // Parse and process mentions
        const mentionMatches = data.content.match(/@[\w]+/g) || [];
        const mentionUsernames = Array.from(new Set(mentionMatches)).map((m: any) => m.substring(1));
        for (const username of mentionUsernames) {
          const mentionedUser = await prisma.user.findUnique({ where: { username } });
          if (mentionedUser && mentionedUser.id !== user.id) {
            await prisma.notification.create({
              data: {
                type: 'MENTION',
                toUserId: mentionedUser.id,
                fromUserId: user.id,
                tweetId: tweet.id,
                previewText: data.content.substring(0, 50)
              }
            });
          }
        }
      }

      // Handle notifications if it's a quote
      if (data.retweetOfId && data.isQuote) {
        const originalTweet = await prisma.tweet.findUnique({ where: { id: data.retweetOfId }, select: { userId: true } });
        if (originalTweet && originalTweet.userId !== user.id) {
          await prisma.notification.create({
            data: {
              type: 'QUOTE',
              toUserId: originalTweet.userId,
              fromUserId: user.id,
              tweetId: tweet.id,
              previewText: data.content?.substring(0, 50) || null
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, tweet: createdTweets[0], tweets: createdTweets });
  } catch (error) {
    console.error('Tweet Post Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
