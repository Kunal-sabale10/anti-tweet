'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Heart, MessageCircle, Repeat2, Hash } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Tweet {
  id: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  user: { id: string; username: string | null; displayName: string | null; avatar: string | null; email: string } | null;
}

interface CommunityDetail {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function CommunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch('/api/communities').then(r => r.json()),
      fetch(`/api/communities/${id}/feed`).then(r => r.json()),
    ]).then(([commData, feedData]) => {
      const comm = commData.communities?.find((c: any) => c.id === id);
      if (comm) setCommunity(comm);
      setTweets(feedData.tweets || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!community) return;
    const res = await fetch(`/api/communities/${id}/join`, { method: 'POST' });
    const data = await res.json();
    setCommunity(prev => prev ? { ...prev, isMember: data.joined, memberCount: prev.memberCount + (data.joined ? 1 : -1) } : prev);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading...</div>;
  if (!community) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Community not found.</div>;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.25rem' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{community.name}</h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{community.memberCount} members</p>
        </div>
        <button
          onClick={handleJoin}
          className="btn"
          style={{
            padding: '0.45rem 1rem', fontSize: '0.85rem',
            background: community.isMember ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg, var(--accent), #60a5fa)',
            color: community.isMember ? 'var(--accent)' : 'white', border: 'none',
          }}
        >
          {community.isMember ? 'Joined ✓' : 'Join'}
        </button>
      </div>

      {/* Description Banner */}
      {community.description && (
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', background: 'rgba(59,130,246,0.04)' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{community.description}</p>
        </div>
      )}

      {/* Tweets Feed */}
      <div>
        {tweets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
            <Hash size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No posts yet. Join and be the first to post!</p>
          </div>
        ) : tweets.map((tweet, i) => (
          <motion.div
            key={tweet.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{ borderBottom: '1px solid var(--card-border)', padding: '1.25rem 1.5rem', display: 'flex', gap: '0.85rem' }}
          >
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: tweet.user?.avatar ? `url(${tweet.user.avatar}) center/cover` : 'linear-gradient(135deg, #60a5fa, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 700, color: 'white',
            }}>
              {!tweet.user?.avatar && (tweet.user?.displayName || tweet.user?.email || 'U').charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Link href={`/profile/${tweet.user?.id}`} style={{ fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', color: 'var(--foreground)' }}>
                  {tweet.user?.displayName || tweet.user?.username || 'Unknown'}
                </Link>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>@{tweet.user?.username}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>·</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{timeAgo(tweet.createdAt)}</span>
              </div>
              {tweet.content && <p style={{ margin: '0 0 0.75rem', lineHeight: 1.5 }}>{tweet.content}</p>}
              {tweet.imageUrl && <img src={tweet.imageUrl} alt="Tweet media" style={{ borderRadius: '12px', maxWidth: '100%', marginBottom: '0.75rem' }} />}
              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Heart size={15} /> {tweet.likeCount}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MessageCircle size={15} /> {tweet.replyCount}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Repeat2 size={15} /> {tweet.retweetCount}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
