"use client";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark as BookmarkIcon, Lock, BarChart2 } from 'lucide-react';
import type { TweetFeedItem, ReplyItem } from '@/lib/types';
import TweetText from '@/components/TweetText';
import VerifiedBadge from '@/components/VerifiedBadge';
import PollWidget from '@/components/PollWidget';

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

export default function TweetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Extend TweetFeedItem to include poll
  type TweetData = TweetFeedItem & { 
    replies: ReplyItem[];
    poll?: any;
  };

  const [tweet, setTweet] = useState<TweetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [postingReply, setPostingReply] = useState(false);

  useEffect(() => {
    const fetchTweet = async () => {
      try {
        const res = await fetch(`/api/tweets/${id}`);
        if (!res.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await res.json() as { tweet: TweetData };
        setTweet(data.tweet);

        // Record view
        fetch(`/api/tweets/${id}/view`, { method: 'POST' }).catch(() => {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTweet();
  }, [id, router]);

  const handleLike = async () => {
    if (!tweet) return;
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/like`, { method: 'POST' });
      const data = await res.json() as { liked: boolean; likeCount: number };
      setTweet({ ...tweet, likedByMe: data.liked, likeCount: data.likeCount });
    } catch { /* ignore */ }
  };

  const handleRetweet = async () => {
    if (!tweet) return;
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/retweet`, { method: 'POST' });
      const data = await res.json() as { retweetedByMe: boolean; retweetCount: number };
      setTweet({ ...tweet, retweetedByMe: data.retweetedByMe, retweetCount: data.retweetCount });
    } catch { /* ignore */ }
  };

  const handleBookmark = async () => {
    if (!tweet) return;
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/bookmark`, { method: 'POST' });
      const data = await res.json() as { bookmarkedByMe: boolean; bookmarkCount: number };
      setTweet({ ...tweet, bookmarkedByMe: data.bookmarkedByMe, bookmarkCount: data.bookmarkCount });
    } catch { /* ignore */ }
  };

  const postReply = async () => {
    if (!replyContent.trim() || postingReply || !tweet) return;
    setPostingReply(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      const data = await res.json() as { reply: ReplyItem };
      setTweet({ ...tweet, replyCount: tweet.replyCount + 1, replies: [data.reply, ...tweet.replies] });
      setReplyContent('');
    } catch { /* ignore */ } finally {
      setPostingReply(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ width: 120, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
        </div>
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
              <div style={{ height: 16, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ height: 12, width: '20%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
          <div style={{ height: 20, width: '90%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: '0.5rem' }} />
          <div style={{ height: 20, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    );
  }

  if (!tweet) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <button onClick={() => router.back()} className="icon-btn-back">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Post</h2>
      </div>

      {/* Main Tweet Detail */}
      <div style={{ padding: '1.25rem 1.25rem 0.5rem', borderBottom: '1px solid var(--card-border)' }}>
        
        {/* Author info */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href={`/profile/${tweet.user?.id}`}>
            <Avatar user={tweet.user} size={48} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/profile/${tweet.user?.id}`} style={{ fontWeight: 800, color: 'var(--foreground)', textDecoration: 'none', fontSize: '1.05rem', display: 'flex', alignItems: 'center' }}>
              {tweet.user?.displayName || tweet.user?.email?.split('@')[0]}
              <VerifiedBadge subscription={tweet.user?.subscription} />
            </Link>
            <span style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              {tweet.user?.username ? `@${tweet.user.username}` : `@${tweet.user?.email?.split('@')[0]}`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '1rem' }}>
          {tweet.content && (
            <div style={{ fontSize: '1.3rem', margin: '0 0 1rem' }}>
              <TweetText content={tweet.content} />
            </div>
          )}
          {tweet.imageUrl && (
            <div style={{ marginBottom: '1rem', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tweet.imageUrl} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}
          {tweet.audioUrl && (
            <div style={{ marginBottom: '1rem', width: '100%' }}>
              <audio src={tweet.audioUrl} controls style={{ width: '100%', height: '40px', borderRadius: '9999px' }} />
            </div>
          )}
          {tweet.poll && (
            <div style={{ marginBottom: '1rem' }}>
              <PollWidget 
                poll={tweet.poll} 
                tweetId={tweet.id} 
                onVoted={(updatedPoll) => setTweet({ ...tweet, poll: updatedPoll })} 
              />
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="tweet-detail-meta" style={{ color: 'var(--muted)', fontSize: '0.95rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.5rem' }}>
          <span>{new Date(tweet.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <span>·</span>
          <span>{new Date(tweet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <BarChart2 size={15} />
            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{tweet.viewCount?.toLocaleString() ?? '0'}</span> Views
          </span>
        </div>

        {/* Counts */}
        <div className="tweet-detail-counts" style={{ padding: '1rem 0', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1.5rem', color: 'var(--muted)', fontSize: '0.95rem' }}>
          <div><span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{tweet.retweetCount}</span> Reposts</div>
          <div><span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{tweet.likeCount}</span> Likes</div>
          <div><span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{tweet.bookmarkCount}</span> Bookmarks</div>
        </div>

        {/* Actions */}
        <div className="tweet-action-row" style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0' }}>
          <button className="action-btn" style={{ color: 'var(--muted)' }} onClick={() => document.getElementById('reply-input')?.focus()}>
            <MessageCircle size={22} />
          </button>
          <button 
            className="action-btn" 
            onClick={handleRetweet}
            style={{ color: tweet.retweetedByMe ? '#10b981' : 'var(--muted)' }}
          >
            <Repeat2 size={22} strokeWidth={tweet.retweetedByMe ? 3 : 2} />
          </button>
          <button
            className="action-btn"
            onClick={handleLike}
            style={{ color: tweet.likedByMe ? '#ef4444' : 'var(--muted)' }}
          >
            <Heart size={22} fill={tweet.likedByMe ? '#ef4444' : 'none'} strokeWidth={tweet.likedByMe ? 0 : 2} />
          </button>
          <button 
            className="action-btn" 
            onClick={handleBookmark}
            style={{ color: tweet.bookmarkedByMe ? '#3b82f6' : 'var(--muted)' }}
          >
            <BookmarkIcon size={22} fill={tweet.bookmarkedByMe ? '#3b82f6' : 'none'} strokeWidth={tweet.bookmarkedByMe ? 0 : 2} />
          </button>
        </div>
      </div>

      {/* Reply Composer */}
      <div className="tweet-reply-composer" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
            Replying to <span style={{ color: 'var(--accent)' }}>@{tweet.user?.username || tweet.user?.email?.split('@')[0]}</span>
          </span>
          <div className="tweet-reply-controls" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <textarea
              id="reply-input"
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Post your reply"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '1.1rem', minHeight: '44px', resize: 'none', paddingTop: '10px' }}
            />
            <button
              onClick={postReply}
              disabled={!replyContent.trim() || postingReply}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.2rem', fontWeight: 700, opacity: replyContent.trim() ? 1 : 0.5 }}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence>
          {tweet.replies.map(reply => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem' }}
            >
              <div style={{ flexShrink: 0 }}>
                <Avatar user={reply.user} size={48} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <Link href={`/profile/${reply.user?.id}`} style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }} className="author-link">
                    {reply.user.displayName || reply.user.email?.split('@')[0]}
                    {/* Note: In a real app we would pass reply.user.subscription here if it existed on ReplyItem's user */}
                  </Link>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    @{reply.user.username || reply.user.email?.split('@')[0]}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>·</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{timeAgo(reply.createdAt)}</span>
                </div>
                <TweetText content={reply.content} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {tweet.replies.length === 0 && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No replies yet</p>
            <p style={{ fontSize: '0.9rem' }}>Be the first to share what you think!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .icon-btn-back {
          background: none; border: none; color: var(--foreground); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%; transition: background 0.2s;
        }
        .icon-btn-back:hover { background: rgba(255,255,255,0.1); }
        .action-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }
        .action-btn:hover { background: rgba(59,130,246,0.1); }
        .author-link:hover { text-decoration: underline !important; }
      `}</style>
    </div>
  );
}
