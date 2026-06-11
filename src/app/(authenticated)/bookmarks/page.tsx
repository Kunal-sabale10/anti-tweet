"use client";
import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark as BookmarkIcon, Heart, MessageCircle, Repeat2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import type { TweetFeedItem, ReplyItem } from '@/lib/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getUserHandle(tweet: TweetFeedItem) {
  return tweet.user?.username
    ? `@${tweet.user.username}`
    : `@${tweet.user?.email?.split('@')[0] || 'anonymous'}`;
}

function getDisplayName(tweet: TweetFeedItem) {
  return tweet.user?.displayName || tweet.user?.email?.split('@')[0] || 'Anonymous';
}

function Avatar({ user, size = 48 }: { user: TweetFeedItem['user']; size?: number }) {
  const colors = [['#3b82f6', '#8b5cf6'], ['#10b981', '#3b82f6'], ['#f59e0b', '#ef4444'], ['#ec4899', '#8b5cf6']];
  const email = user?.email || 'anon';
  const palette = colors[(email.charCodeAt(0) || 0) % colors.length];
  const letter = (user?.displayName || user?.email || 'A').charAt(0).toUpperCase();

  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, color: 'white', fontSize: size * 0.4,
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

function TweetCard({ tweet, onLike, onRetweet, onBookmark }: {
  tweet: TweetFeedItem;
  onLike: (id: string, liked: boolean, count: number) => void;
  onRetweet: (id: string, retweeted: boolean, count: number) => void;
  onBookmark: (id: string, bookmarked: boolean, count: number) => void;
}) {
  const [liking, setLiking] = useState(false);
  const [retweeting, setRetweeting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/like`, { method: 'POST' });
      const data = await res.json() as { liked: boolean; likeCount: number };
      onLike(tweet.id, data.liked, data.likeCount);
    } catch { /* ignore */ } finally {
      setLiking(false);
    }
  };

  const handleRetweet = async () => {
    if (retweeting) return;
    setRetweeting(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/retweet`, { method: 'POST' });
      const data = await res.json() as { retweetedByMe: boolean; retweetCount: number };
      onRetweet(tweet.id, data.retweetedByMe, data.retweetCount);
    } catch { /* ignore */ } finally {
      setRetweeting(false);
    }
  };

  const handleBookmark = async () => {
    if (bookmarking) return;
    setBookmarking(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/bookmark`, { method: 'POST' });
      const data = await res.json() as { bookmarkedByMe: boolean; bookmarkCount: number };
      onBookmark(tweet.id, data.bookmarkedByMe, data.bookmarkCount);
    } catch { /* ignore */ } finally {
      setBookmarking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      style={{ borderBottom: '1px solid var(--card-border)' }}
    >
      {tweet.retweetOf && (
        <div style={{ padding: '0.75rem 1.25rem 0 3.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600 }}>
          <Repeat2 size={13} />
          {tweet.user?.displayName || tweet.user?.email?.split('@')[0]} Reposted
        </div>
      )}

      <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }} className="tweet-hover">
        <div style={{ flexShrink: 0 }}>
          <Avatar user={tweet.retweetOf ? tweet.retweetOf.user : tweet.user} size={48} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <Link
              href={(tweet.retweetOf ? tweet.retweetOf.user?.id : tweet.user?.id) ? `/profile/${tweet.retweetOf ? tweet.retweetOf.user?.id : tweet.user?.id}` : '#'}
              style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none', transition: 'color 0.15s' }}
              className="author-link"
            >
              {getDisplayName(tweet.retweetOf ? tweet.retweetOf : tweet)}
            </Link>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{getUserHandle(tweet.retweetOf ? tweet.retweetOf : tweet)}</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>·</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{timeAgo(tweet.retweetOf ? tweet.retweetOf.createdAt : tweet.createdAt)}</span>
          </div>
          
          <Link href={`/tweet/${tweet.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            {(tweet.retweetOf ? tweet.retweetOf.content : tweet.content) && (
              <p style={{ fontSize: '1rem', lineHeight: '1.5', color: '#e2e8f0', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {tweet.retweetOf ? tweet.retweetOf.content : tweet.content}
              </p>
            )}
            {(tweet.retweetOf ? tweet.retweetOf.imageUrl : tweet.imageUrl) && (
              <div style={{ marginBottom: '0.75rem', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tweet.retweetOf ? tweet.retweetOf.imageUrl! : tweet.imageUrl!} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}
            {(tweet.retweetOf ? tweet.retweetOf.audioUrl : tweet.audioUrl) && (
              <div style={{ marginBottom: '0.75rem', width: '100%' }}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio src={tweet.retweetOf ? tweet.retweetOf.audioUrl! : tweet.audioUrl!} controls style={{ width: '100%', height: '36px', borderRadius: '9999px' }} />
              </div>
            )}
          </Link>

          <div style={{ display: 'flex', gap: '0', marginTop: '0.5rem', maxWidth: '420px', justifyContent: 'space-between' }}>
            <Link href={`/tweet/${tweet.id}`} style={{ textDecoration: 'none' }} className="action-btn-link">
              <button className="action-btn" style={{ color: 'var(--muted)' }}>
                <MessageCircle size={18} />
                <span>{tweet.replyCount > 0 ? tweet.replyCount : ''}</span>
              </button>
            </Link>
            <button 
              className="action-btn" 
              onClick={handleRetweet}
              style={{ color: tweet.retweetedByMe ? '#10b981' : 'var(--muted)', opacity: retweeting ? 0.6 : 1 }}
            >
              <Repeat2 size={18} strokeWidth={tweet.retweetedByMe ? 3 : 2} />
              <span style={{ color: tweet.retweetedByMe ? '#10b981' : 'var(--muted)' }}>
                {tweet.retweetCount > 0 ? tweet.retweetCount : ''}
              </span>
            </button>
            <button
              className="action-btn"
              onClick={handleLike}
              style={{ color: tweet.likedByMe ? '#ef4444' : 'var(--muted)', opacity: liking ? 0.6 : 1 }}
            >
              <Heart size={18} fill={tweet.likedByMe ? '#ef4444' : 'none'} strokeWidth={tweet.likedByMe ? 0 : 2} />
              <span>{tweet.likeCount > 0 ? tweet.likeCount : ''}</span>
            </button>
            <button 
              className="action-btn" 
              onClick={handleBookmark}
              style={{ color: tweet.bookmarkedByMe ? '#3b82f6' : 'var(--muted)', opacity: bookmarking ? 0.6 : 1 }}
            >
              <BookmarkIcon size={18} fill={tweet.bookmarkedByMe ? '#3b82f6' : 'none'} strokeWidth={tweet.bookmarkedByMe ? 0 : 2} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BookmarksPage() {
  const [tweets, setTweets] = useState<TweetFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await fetch('/api/bookmarks');
        const data = await res.json() as { tweets?: TweetFeedItem[]; nextCursor?: string | null };
        setTweets(data.tweets || []);
        setCursor(data.nextCursor || null);
        setHasMore(data.nextCursor !== null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const res = await fetch(`/api/bookmarks?cursor=${cursor}`);
      if (!res.ok) throw new Error('Failed to load more');
      const data = await res.json() as { tweets?: TweetFeedItem[]; nextCursor?: string | null };
      setTweets(prev => [...prev, ...(data.tweets || [])]);
      setCursor(data.nextCursor || null);
      setHasMore(data.nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, hasMore]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, loading, loadMore]);

  const handleLike = (id: string, liked: boolean, count: number) => {
    setTweets(prev => prev.map(t => t.id === id ? { ...t, likedByMe: liked, likeCount: count } : t));
  };

  const handleRetweet = (id: string, retweeted: boolean, count: number) => {
    setTweets(prev => prev.map(t => t.id === id ? { ...t, retweetedByMe: retweeted, retweetCount: count } : t));
  };

  const handleBookmark = (id: string, bookmarked: boolean, count: number) => {
    // If unbookmarked, remove from list
    if (!bookmarked) {
      setTweets(prev => prev.filter(t => t.id !== id));
    } else {
      setTweets(prev => prev.map(t => t.id === id ? { ...t, bookmarkedByMe: bookmarked, bookmarkCount: count } : t));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Bookmarks</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
          @{/* We don't have current user readily available here without context, but we could fetch it */}
          Saved Tweets
        </span>
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem', opacity: 0.5 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: 12, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 12, width: '80%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))
        ) : tweets.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>Save Tweets for later</p>
            <p style={{ fontSize: '0.95rem' }}>Don&apos;t let the good ones fly away! Bookmark Tweets to easily find them again in the future.</p>
          </div>
        ) : (
          <AnimatePresence>
            {tweets.map(tweet => (
              <TweetCard 
                key={tweet.id} 
                tweet={tweet} 
                onLike={handleLike} 
                onRetweet={handleRetweet}
                onBookmark={handleBookmark}
              />
            ))}
            {tweets.length > 0 && hasMore && cursor && (
              <div ref={ref} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                Loading more...
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        .tweet-hover:hover { background: rgba(255,255,255,0.02); }
        .action-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 5px;
          padding: 6px 10px; border-radius: 9999px; font-size: 0.85rem;
          transition: background 0.2s, color 0.2s; font-family: inherit;
        }
        .action-btn-link { text-decoration: none; display: inline-block; }
        .action-btn:hover { background: rgba(59,130,246,0.08); }
        .author-link:hover { color: var(--accent) !important; }
      `}</style>
    </div>
  );
}
