"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat2, Lock, MessageCircle, ChevronUp, ChevronDown, 
  Heart, Bookmark, Flag, ShieldAlert, Send 
} from 'lucide-react';
import type { TweetFeedItem, ReplyItem } from '@/lib/types';
import TweetText from '@/components/TweetText';
import TweetMedia from '@/components/TweetMedia';
import CommunityNoteWidget from '@/components/CommunityNoteWidget';
import AddNoteModal from '@/components/AddNoteModal';
import TweetMenu from '@/components/TweetMenu';

export function timeAgo(dateStr: string) {
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

export function getUserHandle(item: { user?: { username?: string | null; email?: string | null } | null }) {
  if (item.user?.username) return `@${item.user.username}`;
  return `@${item.user?.email?.split('@')[0] || 'anonymous'}`;
}

export function getDisplayName(tweet: TweetFeedItem | ReplyItem) {
  return tweet.user?.displayName || tweet.user?.email?.split('@')[0] || 'Anonymous';
}

export function Avatar({ user, size = 48 }: { user: TweetFeedItem['user']; size?: number }) {
  const colors = [['#3b82f6', '#8b5cf6'], ['#10b981', '#3b82f6'], ['#f59e0b', '#ef4444'], ['#ec4899', '#8b5cf6']];
  const email = user?.email || 'anon';
  const palette = colors[(email.charCodeAt(0) || 0) % colors.length];
  const letter = (user?.displayName || user?.email || 'A').charAt(0).toUpperCase();

  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt="" className="tweet-avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div className="tweet-avatar" style={{
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

export default function TweetCard({ tweet, currentUserId, currentUserSubscription, onLike, onRetweet, onBookmark, onRemoved }: {
  tweet: TweetFeedItem;
  currentUserId?: string;
  currentUserSubscription?: string;
  onLike?: (id: string, liked: boolean, count: number) => void;
  onRetweet?: (id: string, retweeted: boolean, count: number) => void;
  onBookmark?: (id: string, bookmarked: boolean, count: number) => void;
  onRemoved?: (id: string) => void;
}) {
  const [liking, setLiking] = useState(false);
  const [retweeting, setRetweeting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [postingReply, setPostingReply] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [localContent, setLocalContent] = useState<string | null>(null);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/like`, { method: 'POST' });
      const data = await res.json() as { liked: boolean; likeCount: number };
      onLike?.(tweet.id, data.liked, data.likeCount);
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
      onRetweet?.(tweet.id, data.retweetedByMe, data.retweetCount);
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
      onBookmark?.(tweet.id, data.bookmarkedByMe, data.bookmarkCount);
    } catch { /* ignore */ } finally {
      setBookmarking(false);
    }
  };

  const loadReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/replies`);
      const data = await res.json() as { replies: ReplyItem[] };
      setReplies(data.replies || []);
    } catch { /* ignore */ } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next) loadReplies();
  };

  const postReply = async () => {
    if (!replyContent.trim() || postingReply) return;
    setPostingReply(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      const data = await res.json() as { reply: ReplyItem };
      setReplies(prev => [...prev, data.reply]);
      setReplyContent('');
    } catch { /* ignore */ } finally {
      setPostingReply(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderBottom: '1px solid var(--card-border)' }}
      className="tweet-card"
    >
      {tweet.retweetOf && (
        <div style={{ padding: '0.75rem 1.25rem 0 3.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600 }}>
          <Repeat2 size={13} />
          {tweet.user?.displayName || tweet.user?.email?.split('@')[0]} Reposted
        </div>
      )}

      {/* Tweet body */}
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
            {(tweet.retweetOf ? tweet.retweetOf.isFollowersOnly : tweet.isFollowersOnly) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(168,85,247,0.2)', fontWeight: 600 }}>
                <Lock size={10} /> Followers only
              </span>
            )}
            {/* 3-dot menu - pushed to the right */}
            <div style={{ marginLeft: 'auto' }}>
              <TweetMenu
                tweetId={tweet.id}
                isOwner={currentUserId === tweet.user?.id}
                subscription={currentUserSubscription}
                createdAt={tweet.createdAt}
                onDeleted={() => onRemoved?.(tweet.id)}
                onEdited={(newContent) => setLocalContent(newContent)}
              />
            </div>
          </div>
          
          {/* Main content area */}
          <Link href={`/tweet/${tweet.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            {/* Article preview */}
            {(tweet as any).isArticle && (tweet as any).articleTitle && (
              <div style={{ margin: '0.5rem 0 0.75rem', padding: '1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>📰 Article</div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{(tweet as any).articleTitle}</h3>
                {(tweet.retweetOf ? tweet.retweetOf.content : tweet.content) && (
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)', fontSize: '0.85rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {tweet.retweetOf ? tweet.retweetOf.content : tweet.content}
                  </p>
                )}
              </div>
            )}

            {/* Super follower locked content */}
            {(tweet as any).isSuperFollowersOnly && (
              <div style={{ margin: '0.5rem 0 0.75rem', padding: '0.85rem 1rem', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a855f7', fontSize: '0.85rem', fontWeight: 600 }}>
                <Lock size={15} /> Super Followers only content — Subscribe to unlock
              </div>
            )}

            {!((tweet as any).isArticle) && (tweet.retweetOf ? tweet.retweetOf.content : tweet.content) && (
              <TweetText content={tweet.retweetOf ? tweet.retweetOf.content! : tweet.content!} />
            )}
            <TweetMedia tweet={tweet.retweetOf ? tweet.retweetOf : tweet} />
          </Link>

          <CommunityNoteWidget tweetId={tweet.retweetOf ? tweet.retweetOfId! : tweet.id} />

          {/* Actions */}
          <div className="tweet-action-row" style={{ display: 'flex', gap: '0', marginTop: '0.5rem', maxWidth: '420px', justifyContent: 'space-between' }}>
            <button
              className="action-btn"
              onClick={toggleReplies}
              style={{ color: showReplies ? 'var(--accent)' : 'var(--muted)' }}
            >
              <MessageCircle size={18} />
              <span>{tweet.replyCount > 0 ? tweet.replyCount : ''}</span>
              {showReplies ? <ChevronUp size={14} /> : (tweet.replyCount > 0 ? <ChevronDown size={14} /> : null)}
            </button>
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
              <Bookmark size={18} fill={tweet.bookmarkedByMe ? '#3b82f6' : 'none'} strokeWidth={tweet.bookmarkedByMe ? 0 : 2} />
            </button>
            <button 
              className="action-btn" 
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const reason = prompt('Reason for reporting?');
                if (reason) {
                  try {
                    await fetch(`/api/tweets/${tweet.id}/report`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason })
                    });
                    alert('Tweet reported!');
                  } catch {}
                }
              }}
              style={{ color: 'var(--muted)' }}
              title="Report Tweet"
            >
              <Flag size={18} />
            </button>
            <button
              className="action-btn"
              onClick={() => setShowAddNote(true)}
              style={{ color: 'var(--muted)' }}
              title="Add Community Note"
            >
              <ShieldAlert size={18} />
            </button>
          </div>

          <AddNoteModal 
            isOpen={showAddNote} 
            onClose={() => setShowAddNote(false)} 
            tweetId={tweet.retweetOf ? tweet.retweetOfId! : tweet.id} 
          />
        </div>
      </div>

      {/* Replies panel */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--card-border)' }}
          >
            {/* Reply composer */}
            <div className="tweet-reply-composer" style={{ padding: '1rem 1.25rem 0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0 }} />
              <div className="tweet-reply-controls" style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Tweet your reply…"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postReply(); } }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '0.95rem' }}
                />
                <button
                  onClick={postReply}
                  disabled={!replyContent.trim() || postingReply}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem', opacity: replyContent.trim() ? 1 : 0.5 }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* Replies list */}
            {loadingReplies ? (
              <div style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>Loading replies…</div>
            ) : replies.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>No replies yet — be the first!</div>
            ) : (
              replies.map(reply => (
                <div key={reply.id} style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                    {(reply.user.displayName || reply.user.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {getDisplayName(reply as any)}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{getUserHandle(reply)}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>· {timeAgo(reply.createdAt)}</span>
                    </div>
                    <TweetText content={reply.content} />
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        .icon-btn {
          background: none; border: none; color: inherit; cursor: pointer;
          display: flex; align-items: center; gap: 4px; padding: 8px;
          border-radius: 50%; transition: background 0.2s, color 0.2s;
        }
        .icon-btn:hover { background: rgba(59,130,246,0.1); color: var(--accent); }
        .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .tweet-hover:hover { background: rgba(255,255,255,0.02); }
        .action-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 5px;
          padding: 6px 10px; border-radius: 9999px; font-size: 0.85rem;
          transition: background 0.2s, color 0.2s; font-family: inherit;
        }
        .action-btn:hover { background: rgba(59,130,246,0.08); }
        .author-link:hover { color: var(--accent) !important; }
      `}</style>
    </motion.div>
  );
}
