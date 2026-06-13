"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserPlus, UserCheck, MessageSquare, Mic, Heart, Lock, Edit3, Camera, X, Check, MoreHorizontal, ShieldAlert, VolumeX } from 'lucide-react';
import Link from 'next/link';
import type { PublicUser, TweetFeedItem } from '@/lib/types';
import TweetText from '@/components/TweetText';
import VerifiedBadge from '@/components/VerifiedBadge';

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

function getAvatarColors(email: string | null) {
  const palettes = [
    ['#3b82f6', '#8b5cf6'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#8b5cf6'],
    ['#14b8a6', '#60a5fa'],
  ];
  return palettes[((email || '').charCodeAt(0) || 0) % palettes.length];
}

interface EditForm {
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
}

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = params.userId;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [tweets, setTweets] = useState<TweetFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followPending, setFollowPending] = useState(false);
  const [dmPending, setDmPending] = useState(false);

  // Mute/Block state
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ displayName: '', bio: '', avatar: '', banner: '' });
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = myId === userId;

  // Fetch current session user id
  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then((d: { user?: { id: string } }) => { if (d.user?.id) setMyId(d.user.id); })
      .catch(() => {});
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const [userRes, tweetsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/tweets`),
      ]);
      const userData = await userRes.json() as PublicUser;
      if (userData.id) {
        setUser(userData);
        setIsFollowing(userData.isFollowing);
        setFollowerCount(userData.followerCount);
        setEditForm({
          displayName: userData.displayName || '',
          bio: userData.bio || '',
          avatar: userData.avatar || '',
          banner: userData.banner || '',
        });
      }
      const tweetsData = await tweetsRes.json() as { tweets?: TweetFeedItem[]; nextCursor?: string | null };
      setTweets(tweetsData.tweets || []);
      setCursor(tweetsData.nextCursor || null);
      setHasMore(tweetsData.nextCursor !== null);

      if (myId && myId !== userId) {
        const [blockRes, muteRes] = await Promise.all([
          fetch(`/api/users/${userId}/block`),
          fetch(`/api/users/${userId}/mute`)
        ]);
        const blockData = await blockRes.json();
        const muteData = await muteRes.json();
        setIsBlocked(blockData.blocked);
        setIsMuted(muteData.muted);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const res = await fetch(`/api/users/${userId}/tweets?cursor=${cursor}`);
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
  }, [userId, cursor, loadingMore, hasMore]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, loading, loadMore]);

  const handleFollow = async () => {
    if (followPending) return;
    setFollowPending(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      const data = await res.json() as { following: boolean; followerCount: number };
      setIsFollowing(data.following);
      setFollowerCount(data.followerCount);
    } catch { /* ignore */ } finally {
      setFollowPending(false);
    }
  };

  const handleMessage = async () => {
    if (dmPending) return;
    setDmPending(true);
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json() as { conversationId?: string; error?: string };
      if (res.ok && data.conversationId) {
        router.push('/messages');
      } else {
        alert(data.error || 'Cannot message this user');
      }
    } catch { /* ignore */ } finally {
      setDmPending(false);
    }
  };

  const handleToggleBlock = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: 'POST' });
      const data = await res.json();
      setIsBlocked(data.blocked);
      setDropdownOpen(false);
    } catch { /* ignore */ }
  };

  const handleToggleMute = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/mute`, { method: 'POST' });
      const data = await res.json();
      setIsMuted(data.muted);
      setDropdownOpen(false);
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (file: File, field: 'avatar' | 'banner') => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json() as { url?: string };
      if (data.url) {
        setEditForm(prev => ({ ...prev, [field]: data.url! }));
      }
    } catch { /* ignore */ }
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editForm.displayName,
          bio: editForm.bio,
          avatar: editForm.avatar,
          banner: editForm.banner,
        }),
      });
      if (res.ok) {
        setEditOpen(false);
        fetchProfile();
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '0' }}>
        <div style={{ height: 160, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', marginTop: -44, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 18, width: '35%', borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 13, width: '50%', borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>
        <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>User not found</p>
        <button onClick={() => router.back()} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Go back
        </button>
      </div>
    );
  }

  const colors = getAvatarColors(user.email);
  const label = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
  const handle = user.username ? `@${user.username}` : (user.email ? `@${user.email.split('@')[0]}` : '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Back button bar */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', zIndex: 5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.3rem', display: 'flex', borderRadius: '50%' }} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
            {user.displayName || user.email?.split('@')[0]}
            <VerifiedBadge subscription={user.subscription} />
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{tweets.length} posts</div>
        </div>
      </div>

      {/* Banner */}
      <div style={{
        height: 160,
        background: user.banner
          ? `url(${user.banner}) center/cover no-repeat`
          : `linear-gradient(135deg, ${colors[0]}55, ${colors[1]}33, rgba(15,23,42,0.9))`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {!user.banner && [...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            border: `1px solid ${i % 2 === 0 ? colors[0] : colors[1]}`,
            width: `${(i + 1) * 70}px`, height: `${(i + 1) * 70}px`,
            top: '50%', left: '25%', transform: 'translate(-50%, -50%)',
            opacity: 0.08 + (5 - i) * 0.03,
          }} />
        ))}
      </div>

      {/* Profile info row */}
      <div style={{ padding: '0 1.25rem 1.25rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>

          {/* Avatar with online dot */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ position: 'relative', marginTop: -44 }}
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" style={{
                width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                border: '4px solid var(--background)',
                boxShadow: `0 0 0 2px ${colors[0]}44, 0 8px 24px rgba(0,0,0,0.4)`,
              }} />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                border: '4px solid var(--background)',
                boxShadow: `0 0 0 2px ${colors[0]}44, 0 8px 24px rgba(0,0,0,0.4)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem', fontWeight: 900, color: 'white',
              }}>
                {label}
              </div>
            )}
            {/* Online indicator */}
            {user.isOnline && (
              <span style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#22c55e',
                border: '3px solid var(--background)',
                boxShadow: '0 0 8px #22c55e',
              }} title="Online now" />
            )}
          </motion.div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {isOwnProfile ? (
              <button
                onClick={() => setEditOpen(true)}
                style={{
                  padding: '0.45rem 1.2rem', borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                className="edit-btn"
              >
                <Edit3 size={15} />
                Edit profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleMessage}
                  disabled={dmPending}
                  style={{
                    padding: '0.45rem 0.9rem', borderRadius: '9999px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  className="msg-btn"
                >
                  <MessageSquare size={15} />
                  {user.dmPrivacy === 'FOLLOWERS' && !isFollowing ? 'Followers only' : 'Message'}
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followPending}
                  className="btn"
                  style={{
                    padding: '0.45rem 1.2rem',
                    background: isFollowing ? 'rgba(59,130,246,0.12)' : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                    color: isFollowing ? 'var(--accent)' : 'white',
                    border: isFollowing ? '1px solid rgba(59,130,246,0.3)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.88rem',
                    boxShadow: isFollowing ? 'none' : `0 4px 14px ${colors[0]}44`,
                    opacity: followPending ? 0.7 : 1,
                  }}
                >
                  {isFollowing ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      padding: '0.45rem', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    className="msg-btn"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                      borderRadius: '12px', padding: '0.4rem', width: '200px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 10,
                    }}>
                      <button onClick={handleToggleMute} style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }} className="dropdown-item">
                        <VolumeX size={16} /> {isMuted ? 'Unmute' : 'Mute'} @{user.username || user.email?.split('@')[0]}
                      </button>
                      <button onClick={handleToggleBlock} style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }} className="dropdown-item">
                        <ShieldAlert size={16} /> {isBlocked ? 'Unblock' : 'Block'} @{user.username || user.email?.split('@')[0]}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name + handle + online label */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.15rem', display: 'flex', alignItems: 'center' }}>
              {user.displayName || user.email?.split('@')[0]}
              <VerifiedBadge subscription={user.subscription} />
            </h2>
            {user.isOnline && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, color: '#22c55e',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '9999px', padding: '0.1rem 0.5rem',
                letterSpacing: '0.03em',
              }}>● Online</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {handle && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{handle}</span>}
            {user.followsMe && (
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                Follows you
              </span>
            )}
          </div>
          {user.bio && (
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: '0.4rem 0 0', whiteSpace: 'pre-wrap' }}>
              {user.bio}
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem' }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{user.followingCount}</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem', marginLeft: '0.3rem' }}>Following</span>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{followerCount}</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem', marginLeft: '0.3rem' }}>Followers</span>
          </div>
        </motion.div>
      </div>

      {/* Login History */}
      {isOwnProfile && user.loginSessions && user.loginSessions.length > 0 && (
        <div style={{ padding: '0 1.25rem 1.25rem', marginTop: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Login History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {user.loginSessions.slice(0, 5).map(session => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{session.browserType} on {session.os}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>IP: {session.ipAddress} · {session.deviceCat}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right' }}>
                  {new Date(session.loggedInAt).toLocaleDateString()} <br/>
                  {new Date(session.loggedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts tab */}
      <div style={{ borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', borderBottom: '2px solid var(--accent)', display: 'inline-block', marginBottom: -1 }}>
          Posts
        </div>
      </div>

      {/* Tweets */}
      <AnimatePresence>
        {tweets.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <MessageSquare size={40} style={{ opacity: 0.15, display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600 }}>No posts yet</p>
          </div>
        ) : (
          tweets.map((tweet, i) => (
            <motion.div
              key={tweet.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.85rem' }}
              className="tweet-hover"
            >
              {/* avatar */}
              <div style={{ flexShrink: 0 }}>
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                    {label}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                    {user.displayName || user.email?.split('@')[0]}
                    <VerifiedBadge subscription={user.subscription} />
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{handle}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>· {timeAgo(tweet.createdAt)}</span>
                  {tweet.isFollowersOnly && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(168,85,247,0.2)', fontWeight: 600 }}>
                      <Lock size={10} /> Followers only
                    </span>
                  )}
                  {tweet.audioUrl && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(168,85,247,0.2)', fontWeight: 600 }}>
                      <Mic size={10} /> audio
                    </span>
                  )}
                </div>
                <Link href={`/tweet/${tweet.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  {tweet.content && <TweetText content={tweet.content} />}
                  {tweet.imageUrl && (
                    <div style={{ marginBottom: '0.75rem', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tweet.imageUrl} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  )}
                  {tweet.audioUrl && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <audio src={tweet.audioUrl} controls style={{ width: '100%', height: 36 }} />
                    </div>
                  )}
                </Link>
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Heart size={13} fill={tweet.likedByMe ? '#ef4444' : 'none'} style={{ color: tweet.likedByMe ? '#ef4444' : 'inherit' }} />
                    {tweet.likeCount || ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MessageSquare size={13} /> {tweet.replyCount || ''}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {tweets.length > 0 && hasMore && cursor && (
          <div ref={ref} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            Loading more...
          </div>
        )}
      </AnimatePresence>

      {/* ===== EDIT PROFILE MODAL ===== */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
              backdropFilter: 'blur(4px)',
            }}
            onClick={e => { if (e.target === e.currentTarget) setEditOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: '16px', width: '100%', maxWidth: '560px',
                maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '50%' }} className="back-btn">
                    <X size={20} />
                  </button>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Edit profile</h3>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn"
                  style={{ padding: '0.45rem 1.25rem', fontWeight: 700, background: 'white', color: '#0f172a', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>

              {/* Banner area */}
              <div style={{ position: 'relative', height: 130, background: editForm.banner ? `url(${editForm.banner}) center/cover` : `linear-gradient(135deg, ${colors[0]}55, ${colors[1]}33)`, cursor: 'pointer' }}
                onClick={() => bannerInputRef.current?.click()}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <Camera size={22} color="white" />
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'banner'); }} />
              </div>

              {/* Avatar area */}
              <div style={{ padding: '0 1.25rem', position: 'relative', marginTop: -36, marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: 72, height: 72, cursor: 'pointer' }}
                  onClick={() => avatarInputRef.current?.click()}>
                  {editForm.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editForm.avatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--card-bg)' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, border: '3px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>
                      {label}
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} color="white" />
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'avatar'); }} />
                </div>
              </div>

              {/* Fields */}
              <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem 1rem', position: 'relative' }}>
                  <label style={{ position: 'absolute', top: -10, left: 12, background: 'var(--card-bg)', padding: '0 4px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={e => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    maxLength={50}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', fontSize: '1rem', fontFamily: 'inherit' }}
                  />
                  <span style={{ position: 'absolute', bottom: 6, right: 10, color: 'var(--muted)', fontSize: '0.72rem' }}>{editForm.displayName.length}/50</span>
                </div>

                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem 1rem', position: 'relative' }}>
                  <label style={{ position: 'absolute', top: -10, left: 12, background: 'var(--card-bg)', padding: '0 4px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    maxLength={160}
                    rows={3}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', fontSize: '1rem', fontFamily: 'inherit', resize: 'none' }}
                  />
                  <span style={{ position: 'absolute', bottom: 6, right: 10, color: 'var(--muted)', fontSize: '0.72rem' }}>{editForm.bio.length}/160</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .back-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .msg-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .edit-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .tweet-hover:hover { background: rgba(255,255,255,0.02) !important; cursor: pointer; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
      `}</style>
    </div>
  );
}
