"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Hash } from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HashtagTweet {
  id: string;
  content: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  user: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
  } | null;
}

interface HashtagData {
  tag: string;
  tweetCount: number;
  tweets: HashtagTweet[];
  nextCursor?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getHandle(user: HashtagTweet['user']) {
  if (!user) return '@anonymous';
  return user.username ? `@${user.username}` : `@${user.email?.split('@')[0] || 'anonymous'}`;
}

function getDisplayName(user: HashtagTweet['user']) {
  if (!user) return 'Anonymous';
  return user.displayName || user.email?.split('@')[0] || 'Anonymous';
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const PALETTES: [string, string][] = [
  ['#3b82f6', '#8b5cf6'],
  ['#10b981', '#3b82f6'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
];

function Avatar({ user, size = 44 }: { user: HashtagTweet['user']; size?: number }) {
  const email = user?.email || 'anon';
  const palette = PALETTES[(email.charCodeAt(0) || 0) % PALETTES.length];
  const letter = (user?.displayName || user?.email || 'A').charAt(0).toUpperCase();

  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.avatar}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: 'white',
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

// ─── Tweet Card ───────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};

function TweetCard({ tweet, index }: { tweet: HashtagTweet; index: number }) {
  const user = tweet.user;
  const profileHref = user?.id ? `/profile/${user.id}` : '#';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        borderBottom: '1px solid var(--card-border)',
        padding: '1.1rem 1.25rem',
        display: 'flex',
        gap: '0.875rem',
        transition: 'background 0.15s',
      }}
      className="ht-card"
    >
      {/* Avatar */}
      <Link href={profileHref} style={{ flexShrink: 0 }}>
        <Avatar user={user} size={44} />
      </Link>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Meta row */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          <Link
            href={profileHref}
            style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)', textDecoration: 'none' }}
            className="ht-author"
          >
            {getDisplayName(user)}
          </Link>
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{getHandle(user)}</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>·</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{timeAgo(tweet.createdAt)}</span>
        </div>

        {/* Content */}
        <Link href={`/tweet/${tweet.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {tweet.content && (
            <p
              style={{
                margin: '0 0 0.65rem',
                fontSize: '0.975rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--foreground)',
              }}
            >
              {tweet.content}
            </p>
          )}

          {/* Image */}
          {tweet.imageUrl && (
            <div
              style={{
                marginBottom: '0.75rem',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid var(--card-border)',
                maxWidth: '100%',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tweet.imageUrl}
                alt="Media"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}

          {/* Audio */}
          {tweet.audioUrl && (
            <div style={{ marginBottom: '0.75rem' }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                src={tweet.audioUrl}
                controls
                style={{ width: '100%', height: 36, borderRadius: '9999px' }}
              />
            </div>
          )}
        </Link>

        {/* Actions */}
        <div className="hashtag-action-row" style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem' }}>
          <div className="ht-action">
            <MessageCircle size={17} />
            {tweet.replyCount > 0 && <span>{tweet.replyCount}</span>}
          </div>
          <div className="ht-action" style={{ color: tweet.retweetCount > 0 ? '#10b981' : 'var(--muted)' }}>
            <Repeat2 size={17} />
            {tweet.retweetCount > 0 && <span>{tweet.retweetCount}</span>}
          </div>
          <div className="ht-action" style={{ color: tweet.likeCount > 0 ? '#ef4444' : 'var(--muted)' }}>
            <Heart size={17} fill={tweet.likeCount > 0 ? '#ef4444' : 'none'} strokeWidth={tweet.likeCount > 0 ? 0 : 2} />
            {tweet.likeCount > 0 && <span>{tweet.likeCount}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderBottom: '1px solid var(--card-border)', padding: '1.1rem 1.25rem', display: 'flex', gap: '0.875rem', opacity: 0.45 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: 4 }}>
        <div style={{ height: 12, width: '35%', borderRadius: 6, background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ height: 12, width: '80%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ height: 12, width: '55%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tag }: { tag: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))',
          border: '1px solid rgba(59,130,246,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Hash size={32} color="var(--accent)" strokeWidth={1.8} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '1.15rem', margin: '0 0 0.4rem', color: 'var(--foreground)' }}>
          No posts for #{tag}
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
          Be the first to post with this hashtag!
        </p>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HashtagPage() {
  const params = useParams<{ tag: string }>();
  const router = useRouter();
  const tag = params.tag ?? '';

  const [data, setData] = useState<HashtagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!tag) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/hashtags/${encodeURIComponent(tag)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HashtagData>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setCursor(json.nextCursor || null);
          setHasMore(json.nextCursor !== null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Failed to load hashtag');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tag]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const res = await fetch(`/api/hashtags/${encodeURIComponent(tag)}?cursor=${cursor}`);
      if (!res.ok) throw new Error('Failed to load more');
      const json = await res.json() as HashtagData;
      setData(prev => prev ? {
        ...prev,
        tweets: [...prev.tweets, ...json.tweets]
      } : json);
      setCursor(json.nextCursor || null);
      setHasMore(json.nextCursor !== null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [tag, cursor, loadingMore, hasMore]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, loading, loadMore]);

  const tweetCount = data?.tweetCount ?? 0;
  const tweets = data?.tweets ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Sticky Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--card-border)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        {/* Back button */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            borderRadius: '50%',
            transition: 'background 0.18s',
          }}
          className="ht-back-btn"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        {/* Title group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            #{tag}
          </h1>
          {!loading && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}
            >
              {tweetCount.toLocaleString()} {tweetCount === 1 ? 'post' : 'posts'}
            </motion.span>
          )}
        </div>
      </header>

      {/* ── Feed ── */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}
            >
              <p style={{ fontWeight: 600, color: '#f87171', marginBottom: '0.5rem' }}>Something went wrong</p>
              <p style={{ fontSize: '0.875rem' }}>{error}</p>
            </motion.div>
          ) : tweets.length === 0 ? (
            <EmptyState key="empty" tag={tag} />
          ) : (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              {tweets.map((tweet, i) => (
                <TweetCard key={tweet.id} tweet={tweet} index={i} />
              ))}
              {hasMore && cursor && (
                <div ref={ref} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Loading more...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scoped Styles ── */}
      <style jsx>{`
        .ht-card:hover {
          background: rgba(255, 255, 255, 0.025);
        }
        .ht-author:hover {
          color: var(--accent) !important;
        }
        .ht-back-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .ht-action {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 9999px;
          font-size: 0.82rem;
          color: var(--muted);
          user-select: none;
          transition: color 0.15s;
        }
      `}</style>
    </div>
  );
}
