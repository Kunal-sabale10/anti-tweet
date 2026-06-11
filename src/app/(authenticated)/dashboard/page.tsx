"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, Mic, Smile, X, Send, BarChart2,
  Heart, MessageCircle, Repeat2, Share, CheckCircle2,
  ChevronDown, ChevronUp, Play, Pause, Bookmark, Calendar, Plus, Flag,
  Clock, Lock, FileImage, ShieldAlert
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import type { TweetFeedItem, ReplyItem } from '@/lib/types';
import TweetText from '@/components/TweetText';
import VerifiedBadge from '@/components/VerifiedBadge';
import TweetMedia from '@/components/TweetMedia';
import CommunityNoteWidget from '@/components/CommunityNoteWidget';
import AddNoteModal from '@/components/AddNoteModal';
import TweetMenu from '@/components/TweetMenu';
import GifPicker from '@/components/GifPicker';
import { getErrorMessage } from '@/lib/errors';
import { useRealTime } from '@/components/RealTimeProvider';
import TweetCard from '@/components/TweetCard';

export default function HomeFeed() {
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [tweets, setTweets] = useState<TweetFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newTweetsBanner, setNewTweetsBanner] = useState<TweetFeedItem[]>([]);
  const [mediaItems, setMediaItems] = useState<{url: string, type: string}[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const notifiedTweetIds = useRef<Set<string>>(new Set());
  const esRef = useRef<EventSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; subscription: string } | null>(null);
  
  // Load current user info
  useEffect(() => {
    fetch('/api/user/profile').then(r => r.json()).then(d => {
      if (d.user) setCurrentUser({ id: d.user.id, subscription: d.user.subscription });
    }).catch(() => {});
  }, []);
  
  // Pickers for Dashboard Composer
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);

  const fetchTweets = useCallback(async (feed: 'foryou' | 'following') => {
    try {
      setInitialLoading(true);
      const res = await fetch(`/api/tweets?feed=${feed}`);
      const data = await res.json() as { tweets?: TweetFeedItem[]; nextCursor?: string | null };
      const newTweets = data.tweets || [];
      setNextCursor(data.nextCursor || null);

      // Notification triggers
      newTweets.forEach((tweet) => {
        if (notifiedTweetIds.current.has(tweet.id)) return;
        const tweetContent = tweet.content?.toLowerCase() || '';
        if (tweetContent.includes('cricket') || tweetContent.includes('science')) {
          if ('Notification' in window && Notification.permission === 'granted') {
            notifiedTweetIds.current.add(tweet.id);
            new Notification('New Anti-Tweet Alert!', {
              body: tweet.content || 'A new post matches your interests.',
              icon: '/favicon.ico'
            });
          }
        }
      });

      setTweets(newTweets);
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Fetch when tab changes
  useEffect(() => {
    fetchTweets(activeTab);
  }, [activeTab, fetchTweets]);

  const loadMoreTweets = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await fetch(`/api/tweets?feed=${activeTab}&cursor=${nextCursor}`);
      const data = await res.json() as { tweets?: TweetFeedItem[]; nextCursor?: string | null };
      const newTweets = data.tweets || [];
      setTweets(prev => [...prev, ...newTweets]);
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, nextCursor, loadingMore]);

  useEffect(() => {
    if (inView && nextCursor && !loadingMore && !initialLoading) {
      loadMoreTweets();
    }
  }, [inView, nextCursor, loadingMore, initialLoading, loadMoreTweets]);

  const { newTweets, clearNewTweets } = useRealTime();

  useEffect(() => {
    if (newTweets.length > 0) {
      setNewTweetsBanner(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const unique = newTweets.filter(t => !existingIds.has(t.id));
        return [...unique, ...prev];
      });
      clearNewTweets();
    }
  }, [newTweets, clearNewTweets]);

  const loadNewTweets = () => {
    setTweets(prev => [...newTweetsBanner, ...prev]);
    setNewTweetsBanner([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaItems.length >= 4) { alert('Max 4 items allowed'); return; }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as { success: boolean; url: string };
      if (data.success) {
        setMediaItems(prev => [...prev, { url: data.url, type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' }]);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const postTweet = async () => {
    if (!content.trim() && mediaItems.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, media: mediaItems })
      });
      const data = await res.json() as { error?: string; tweet?: { id: string } };
      if (!res.ok) {
        alert(data.error || 'Failed to post');
        return;
      }
      setContent('');
      setMediaItems([]);
      fetchTweets(activeTab);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (id: string, liked: boolean, count: number) => {
    setTweets(prev => prev.map(t => t.id === id ? { ...t, likedByMe: liked, likeCount: count } : t));
  };

  const handleRetweet = (id: string, retweeted: boolean, count: number) => {
    setTweets(prev => prev.map(t => t.id === id ? { ...t, retweetedByMe: retweeted, retweetCount: count } : t));
  };

  const handleBookmark = (id: string, bookmarked: boolean, count: number) => {
    setTweets(prev => prev.map(t => t.id === id ? { ...t, bookmarkedByMe: bookmarked, bookmarkCount: count } : t));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => setActiveTab('foryou')}
          style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: activeTab === 'foryou' ? 'var(--foreground)' : 'var(--muted)', fontWeight: activeTab === 'foryou' ? 700 : 500, cursor: 'pointer', position: 'relative', transition: 'color 0.2s' }}
        >
          For you
          {activeTab === 'foryou' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '56px', height: '4px', background: 'var(--accent)', borderRadius: '4px 4px 0 0' }} />}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: activeTab === 'following' ? 'var(--foreground)' : 'var(--muted)', fontWeight: activeTab === 'following' ? 700 : 500, cursor: 'pointer', position: 'relative', transition: 'color 0.2s' }}
        >
          Following
          {activeTab === 'following' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '56px', height: '4px', background: 'var(--accent)', borderRadius: '4px 4px 0 0' }} />}
        </button>
      </div>

      {/* Composer */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem' }}>
        <div style={{ minWidth: '48px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is happening?!"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              color: 'white',
              resize: 'none',
              outline: 'none',
              minHeight: '80px',
              fontFamily: 'inherit',
            }}
          />
          
          {mediaItems.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', width: '100%' }}>
              {mediaItems.map((item, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', aspectRatio: '1/1' }}>
                  {item.type === 'VIDEO' ? (
                     <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                     <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <button 
                    onClick={() => setMediaItems(prev => prev.filter((_, i) => i !== idx))} 
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--accent)' }}>
              <button 
                onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
                style={{ background: showEmoji ? 'rgba(59, 130, 246, 0.1)' : 'none', border: 'none', color: 'inherit', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Smile size={20} />
              </button>
              <button 
                onClick={() => { setShowGif(!showGif); setShowEmoji(false); }}
                style={{ background: showGif ? 'rgba(59, 130, 246, 0.1)' : 'none', border: 'none', color: 'inherit', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}
              >
                GIF
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,video/mp4,video/webm,video/quicktime" style={{ display: 'none' }} />
              <button className="icon-btn" aria-label="Add image" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                {uploadingImage ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={20} />}
              </button>
              <button className="icon-btn"><Mic size={20} /></button>
              <button className="icon-btn"><Clock size={20} /></button>
            </div>
            
            <AnimatePresence>
              {showEmoji && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', zIndex: 100 }}
                >
                  <EmojiPicker theme={Theme.DARK} onEmojiClick={(emoji: EmojiClickData) => setContent(c => c + emoji.emoji)} />
                </motion.div>
              )}
              {showGif && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', zIndex: 100, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1rem', width: '320px' }}
                >
                  <GifPicker onSelect={(url) => {
                    if (mediaItems.length < 4) setMediaItems(prev => [...prev, {url, type: 'GIF'}]);
                    setShowGif(false);
                  }} />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={postTweet}
              disabled={loading || uploadingImage || (!content.trim() && mediaItems.length === 0)}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem', opacity: (content.trim() || mediaItems.length > 0) && !uploadingImage ? 1 : 0.6 }}
            >
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* New tweets banner */}
      <AnimatePresence>
        {newTweetsBanner.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={loadNewTweets}
            style={{
              width: '100%', padding: '0.75rem', textAlign: 'center',
              background: 'rgba(59,130,246,0.12)', border: 'none',
              borderBottom: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            ↑ {newTweetsBanner.length} new tweet{newTweetsBanner.length > 1 ? 's' : ''} — Click to load
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {initialLoading ? (
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
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{activeTab === 'following' ? "You aren't following anyone yet." : "No tweets yet."}</p>
            <p style={{ fontSize: '0.9rem' }}>{activeTab === 'following' ? "Find some people to follow to see their tweets here." : "Start the conversation!"}</p>
          </div>
        ) : (
          tweets.map(tweet => (
            <TweetCard 
              key={tweet.id} 
              tweet={tweet} 
              currentUserId={currentUser?.id}
              currentUserSubscription={currentUser?.subscription}
              onLike={handleLike} 
              onRetweet={handleRetweet}
              onBookmark={handleBookmark}
              onRemoved={(id) => setTweets(prev => prev.filter(t => t.id !== id))}
            />
          ))
        )}
        
        {tweets.length > 0 && nextCursor && (
          <div ref={ref} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            Loading more...
          </div>
        )}
      </div>

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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
