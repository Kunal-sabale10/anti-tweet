"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Mail, Phone, Globe, Bell, BellOff,
  Mic, Crown, Shield, Clock, Zap, Edit3,
  CheckCircle, MessageCircle, Hash, Camera, Trash2, X, Upload, Loader
} from 'lucide-react';

interface ProfileTweet {
  id: string;
  content: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  isArticle: boolean;
  articleTitle: string | null;
  createdAt: string;
  likeCount?: number;
  replyCount?: number;
}

interface LoginSession {
  id: string;
  browserType: string | null;
  os: string | null;
  deviceCat: string | null;
  ipAddress: string | null;
  loggedInAt: string;
}

interface ProfileUser {
  id: string;
  email: string | null;
  phone: string | null;
  subscription: string;
  language: string;
  notificationPref: boolean;
  avatar: string | null;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  createdAt: string;
  tweets: ProfileTweet[];
  loginSessions: LoginSession[];
  _count: { followers: number; following: number };
}

const SUBSCRIPTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; limit: number }> = {
  FREE:   { label: 'Free',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', icon: <Zap size={14} />,    limit: 1  },
  BRONZE: { label: 'Bronze', color: '#cd7f32', bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.3)',  icon: <Shield size={14} />, limit: 3  },
  SILVER: { label: 'Silver', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.4)', icon: <Crown size={14} />,  limit: 5  },
  GOLD:   { label: 'Gold',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)', icon: <Crown size={14} />,  limit: Infinity },
};

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English', HI: 'Hindi', ES: 'Spanish', PT: 'Portuguese', ZH: 'Chinese', FR: 'French',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatJoined(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getAvatarColors(email: string) {
  const palettes = [
    ['#3b82f6', '#8b5cf6'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#8b5cf6'],
    ['#14b8a6', '#60a5fa'],
  ];
  const idx = (email.charCodeAt(0) || 0) % palettes.length;
  return palettes[idx];
}

type Tab = 'posts' | 'replies' | 'media' | 'likes' | 'activity';

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const [tabData, setTabData] = useState<{ replies: any[]; media: any[]; likes: any[] }>({ replies: [], media: [], likes: [] });
  const [tabLoading, setTabLoading] = useState(false);

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then((data: { user?: ProfileUser }) => {
        if (data.user) {
          setUser(data.user);
          setAvatarUrl(data.user.avatar || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (!user) return;
    if (tab === 'replies') {
      setTabLoading(true);
      fetch(`/api/users/${user.id}/tweets?type=replies`)
        .then(r => r.json()).then(d => setTabData(p => ({ ...p, replies: d.tweets || [] })))
        .catch(() => {}).finally(() => setTabLoading(false));
    } else if (tab === 'media') {
      setTabLoading(true);
      fetch(`/api/users/${user.id}/tweets?type=media`)
        .then(r => r.json()).then(d => setTabData(p => ({ ...p, media: d.tweets || [] })))
        .catch(() => {}).finally(() => setTabLoading(false));
    } else if (tab === 'likes') {
      setTabLoading(true);
      fetch(`/api/users/${user.id}/tweets?type=likes`)
        .then(r => r.json()).then(d => setTabData(p => ({ ...p, likes: d.tweets || [] })))
        .catch(() => {}).finally(() => setTabLoading(false));
    }
  }, [tab, user]);

  // Close menu on outside click
  useEffect(() => {
    if (!showPhotoMenu) return;
    const close = () => setShowPhotoMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showPhotoMenu]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setShowPhotoMenu(false);

    // Client-side validation
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Only JPEG, PNG, WebP or GIF allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.');
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      // ── Step 1: Get Cloudinary config (cloud_name + upload_preset) ─────────
      const cfgRes = await fetch('/api/upload/config');
      const cfgData = await cfgRes.json() as {
        cloud_name?: string; upload_preset?: string; error?: string;
      };
      if (!cfgRes.ok || !cfgData.cloud_name) {
        throw new Error(cfgData.error || 'Could not get upload config');
      }

      // ── Step 2: Upload DIRECTLY to Cloudinary — UNSIGNED (no API key needed)
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', cfgData.upload_preset!);
      fd.append('folder', 'anti_tweet_avatars');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cfgData.cloud_name}/image/upload`,
        { method: 'POST', body: fd }
      );
      const cloudData = await cloudRes.json() as { secure_url?: string; error?: { message: string } };

      if (!cloudRes.ok || !cloudData.secure_url) {
        throw new Error(cloudData.error?.message || 'Upload to Cloudinary failed');
      }

      // ── Step 3: Save the Cloudinary URL to our database ───────────────────
      const saveRes = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: cloudData.secure_url }),
      });
      const saveData = await saveRes.json() as { avatarUrl?: string; error?: string };
      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save photo');

      setAvatarUrl(saveData.avatarUrl || cloudData.secure_url);
      setPreview(null);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoMenu(false);
    setRemoving(true);
    try {
      await fetch('/api/user/avatar', { method: 'DELETE' });
      setAvatarUrl(null);
    } catch {
      setUploadError('Failed to remove photo.');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '0' }}>
        <div style={{ height: 160, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', marginTop: '-48px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 20, width: '40%', borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 14, width: '60%', borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <style jsx>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>
        Failed to load profile.
      </div>
    );
  }

  const handle = user.username ? `@${user.username}` : `@${user.email?.split('@')[0] || user.phone || 'user'}`;
  const displayName = user.displayName || user.email?.split('@')[0] || user.phone || 'User';
  const avatarColors = getAvatarColors(user.email || handle);
  const subCfg = SUBSCRIPTION_CONFIG[user.subscription] || SUBSCRIPTION_CONFIG.FREE;
  const tweetCount = user.tweets.length;
  const postLimit = subCfg.limit === Infinity ? '∞' : subCfg.limit;
  const displayAvatar = preview || avatarUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        id="avatar-upload-input"
      />

      {/* Banner */}
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, ${avatarColors[0]}33, ${avatarColors[1]}33, rgba(15,23,42,0.8))`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `1px solid ${i % 2 === 0 ? avatarColors[0] : avatarColors[1]}`,
              width: `${(i + 1) * 80}px`,
              height: `${(i + 1) * 80}px`,
              top: '50%', left: '30%',
              transform: 'translate(-50%, -50%)',
              opacity: 1 - i * 0.12,
            }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: '1rem', right: '1.25rem' }}>
          <a href="/settings" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px',
            padding: '0.4rem 1rem', color: 'white',
            fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
          }}>
            <Edit3 size={13} /> Edit Profile
          </a>
        </div>
      </div>

      {/* Avatar + Name Row */}
      <div style={{ padding: '0 1.25rem 1.25rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>

          {/* ── AVATAR with upload overlay ── */}
          <div style={{ position: 'relative', marginTop: '-48px', flexShrink: 0 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                width: 96, height: 96,
                borderRadius: '50%',
                border: '4px solid var(--background)',
                boxShadow: `0 0 0 2px ${avatarColors[0]}55, 0 8px 32px rgba(0,0,0,0.4)`,
                overflow: 'hidden',
                position: 'relative',
                background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={(e) => { e.stopPropagation(); setShowPhotoMenu(v => !v); }}
            >
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', userSelect: 'none' }}>
                  {handle.charAt(0).toUpperCase()}
                </span>
              )}

              {/* Camera hover overlay */}
              <div className="avatar-overlay">
                {uploading || removing ? (
                  <Loader size={22} className="spin" />
                ) : (
                  <Camera size={22} />
                )}
              </div>
            </motion.div>

            {/* Upload spinner badge */}
            {(uploading || removing) && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: '#3b82f6', border: '2px solid var(--background)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Loader size={13} color="white" className="spin" />
              </motion.div>
            )}

            {/* Photo action menu */}
            <AnimatePresence>
              {showPhotoMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  transition={{ duration: 0.15 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    zIndex: 50,
                    background: 'rgba(15,23,42,0.98)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '14px',
                    padding: '0.4rem',
                    minWidth: '190px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <button
                    onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      width: '100%', padding: '0.65rem 0.85rem',
                      background: 'none', border: 'none',
                      color: 'var(--foreground)', cursor: 'pointer',
                      borderRadius: '10px', fontSize: '0.88rem', fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                    className="menu-item"
                  >
                    <Upload size={15} style={{ color: '#3b82f6' }} />
                    Upload new photo
                  </button>

                  {avatarUrl && (
                    <button
                      onClick={handleRemovePhoto}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        width: '100%', padding: '0.65rem 0.85rem',
                        background: 'none', border: 'none',
                        color: '#f87171', cursor: 'pointer',
                        borderRadius: '10px', fontSize: '0.88rem', fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                      className="menu-item-danger"
                    >
                      <Trash2 size={15} />
                      Remove photo
                    </button>
                  )}

                  <div style={{ borderTop: '1px solid var(--card-border)', margin: '0.3rem 0.4rem 0.2rem', paddingTop: '0.4rem' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--muted)', padding: '0 0.45rem 0.3rem', margin: 0 }}>
                      JPEG, PNG, WebP or GIF · Max 5MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subscription Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', borderRadius: '9999px',
              background: subCfg.bg, border: `1px solid ${subCfg.border}`,
              color: subCfg.color, fontSize: '0.82rem', fontWeight: 700,
            }}
          >
            {subCfg.icon}
            {subCfg.label} Plan
          </motion.div>
        </div>

        {/* Upload error */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', padding: '0.6rem 0.9rem', marginBottom: '0.75rem',
                color: '#f87171', fontSize: '0.85rem',
              }}
            >
              <span>{uploadError}</span>
              <button onClick={() => setUploadError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0' }}>
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload progress banner */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '10px', padding: '0.6rem 0.9rem', marginBottom: '0.75rem',
                color: '#3b82f6', fontSize: '0.85rem',
              }}
            >
              <Loader size={14} className="spin" />
              Uploading your photo…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name & Handle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{displayName}</h2>
              <CheckCircle size={18} style={{ color: avatarColors[0] }} />
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{handle}</div>
            {user.bio && (
              <p style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '0.5rem', lineHeight: 1.5 }}>{user.bio}</p>
            )}
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} />
              Joined {formatJoined(user.createdAt)}
            </div>
          </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex', gap: '0', marginTop: '1.25rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px', overflow: 'hidden',
          }}
        >
          {[
            { label: 'Posts',      value: tweetCount,                                   icon: <MessageCircle size={16} /> },
            { label: 'Followers',  value: user._count.followers,                        icon: <Hash size={16} /> },
            { label: 'Following',  value: user._count.following,                        icon: <Mic size={16} /> },
            { label: 'Sessions',   value: user.loginSessions.length,                   icon: <Shield size={16} /> },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, padding: '1rem 0.5rem', textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--card-border)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: avatarColors[0], marginBottom: '0.25rem' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{stat.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Info Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}
        >
          {user.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              <Mail size={12} /> {user.email}
            </span>
          )}
          {user.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              <Phone size={12} /> {user.phone}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <Globe size={12} /> {LANGUAGE_LABELS[user.language] || user.language}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: user.notificationPref ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${user.notificationPref ? 'rgba(59,130,246,0.3)' : 'var(--card-border)'}`, borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: user.notificationPref ? '#3b82f6' : 'var(--muted)' }}>
            {user.notificationPref ? <Bell size={12} /> : <BellOff size={12} />}
            {user.notificationPref ? 'Notifications On' : 'Notifications Off'}
          </span>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--card-border)', display: 'flex', overflowX: 'auto' }}>
        {([
          { key: 'posts', label: `Posts` },
          { key: 'replies', label: 'Replies' },
          { key: 'media', label: 'Media' },
          { key: 'likes', label: 'Likes' },
          { key: 'activity', label: 'Activity' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: '1 0 auto', padding: '1rem',
              background: 'none', border: 'none',
              borderBottom: tab === t.key ? `2px solid ${avatarColors[0]}` : '2px solid transparent',
              color: tab === t.key ? 'var(--foreground)' : 'var(--muted)',
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: '0.9rem', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
          >
            {t.key === 'posts' ? `Posts (${tweetCount})` : t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'posts' ? (
          <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {user.tweets.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={28} style={{ opacity: 0.3 }} />
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>No posts yet</p>
                <p style={{ fontSize: '0.85rem' }}>Head to the dashboard to post your first tweet!</p>
                <a href="/dashboard" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', textDecoration: 'none' }}>
                  Go to Dashboard
                </a>
              </div>
            ) : (
              user.tweets.map((tweet, idx) => (
                <motion.div
                  key={tweet.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem' }}
                  className="tweet-row"
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: displayAvatar ? 'none' : `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                    flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700, color: 'white',
                  }}>
                    {displayAvatar
                      ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : handle.charAt(0).toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>@{handle}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>· {timeAgo(tweet.createdAt)}</span>
                      {tweet.audioUrl && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#a855f7', fontWeight: 600, background: 'rgba(168,85,247,0.1)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(168,85,247,0.2)' }}>
                          <Mic size={10} /> audio
                        </span>
                      )}
                      {(tweet as any).isArticle && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, background: 'rgba(59,130,246,0.1)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                          📰 Article
                        </span>
                      )}
                    </div>
                    {(tweet as any).articleTitle && <p style={{ margin: '0 0 0.3rem', fontWeight: 800, fontSize: '1rem' }}>{(tweet as any).articleTitle}</p>}
                    {tweet.content && (
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#e2e8f0', margin: 0 }}>{tweet.content}</p>
                    )}
                    {tweet.audioUrl && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <audio src={tweet.audioUrl} controls style={{ width: '100%', height: 36, borderRadius: 9999 }} />
                      </div>
                    )}
                    {tweet.imageUrl && (
                      <img src={tweet.imageUrl} alt="" style={{ marginTop: '0.75rem', borderRadius: '12px', maxWidth: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

        ) : tab === 'replies' ? (
          <motion.div key="replies" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tabLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div> :
              tabData.replies.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>No replies yet.</div>
              ) : tabData.replies.map((t: any, idx: number) => (
                <div key={t.id} style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Replying to a post · {timeAgo(t.createdAt)}</div>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>{t.content}</p>
                </div>
              ))
            }
          </motion.div>

        ) : tab === 'media' ? (
          <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tabLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div> :
              tabData.media.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>No media posts yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                  {tabData.media.map((t: any) => (
                    <a key={t.id} href={`/tweet/${t.id}`} style={{ aspectRatio: '1/1', overflow: 'hidden', display: 'block' }}>
                      <img src={t.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }} />
                    </a>
                  ))}
                </div>
              )
            }
          </motion.div>

        ) : tab === 'likes' ? (
          <motion.div key="likes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tabLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div> :
              tabData.likes.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>No liked posts yet.</div>
              ) : tabData.likes.map((t: any) => (
                <div key={t.id} style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #a855f7)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                    {(t.user?.displayName || t.user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.user?.displayName || t.user?.username}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>@{t.user?.username} · {timeAgo(t.createdAt)}</span>
                    </div>
                    {t.content && <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>{t.content}</p>}
                  </div>
                </div>
              ))
            }
          </motion.div>

        ) : (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {user.loginSessions.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>No login sessions found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 1.25rem', color: 'var(--muted)', fontSize: '0.8rem', borderBottom: '1px solid var(--card-border)' }}>
                  Showing last {user.loginSessions.length} login sessions
                </div>
                {user.loginSessions.map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    className="tweet-row"
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '12px',
                      background: idx === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${idx === 0 ? 'rgba(16,185,129,0.3)' : 'var(--card-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Shield size={18} style={{ color: idx === 0 ? '#10b981' : 'var(--muted)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {session.browserType || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', borderRadius: '9999px', padding: '0.1rem 0.5rem', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--muted)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                        {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                        {session.deviceCat && <span>· {session.deviceCat}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      <Clock size={13} />
                      {timeAgo(session.loggedInAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 50%;
        }
        .avatar-overlay:hover,
        div:hover > .avatar-overlay {
          opacity: 1;
        }
        .tweet-row:hover { background: rgba(255,255,255,0.02); }
        .menu-item:hover { background: rgba(255,255,255,0.06) !important; }
        .menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
    </div>
  );
}
