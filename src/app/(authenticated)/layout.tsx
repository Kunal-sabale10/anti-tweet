"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Hash, Bell, Bookmark, List, Users, Sparkles, Star,
  MessageSquare, User, Settings, Briefcase, BarChart2, Search,
  UserPlus, UserCheck, MoreHorizontal, Check, Feather
} from 'lucide-react';
import TweetModal from '@/components/TweetModal';
import Logo from '@/components/Logo';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import { RealTimeProvider, useRealTime } from '@/components/RealTimeProvider';

interface SuggestedUser {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  followerCount: number;
  isFollowing: boolean;
}

function AuthenticatedLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [isTweetModalOpen, setIsTweetModalOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<{users: any[], hashtags: any[]}>({ users: [], hashtags: [] });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [leftSearchQ, setLeftSearchQ] = useState('');
  const [leftAutocompleteResults, setLeftAutocompleteResults] = useState<{users: any[]}>({ users: [] });
  const [showLeftAutocomplete, setShowLeftAutocomplete] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leftSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { unreadMessageCount, unreadNotificationCount } = useRealTime();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [trending, setTrending] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    fetch('/api/user/profile').then(r => r.json()).then(data => {
      if (data.error === 'Unauthorized' || data.error === 'User not found') {
        // Stale session (e.g. after database wipe)
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        router.push('/login');
      } else if (data.user) {
        setCurrentUser(data.user);
      }
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOpenTweetModal = () => setIsTweetModalOpen(true);
    window.addEventListener('open-tweet-modal', handleOpenTweetModal);
    return () => window.removeEventListener('open-tweet-modal', handleOpenTweetModal);
  }, []);

  useEffect(() => {
    if (searchQ.length < 2) {
      setAutocompleteResults({ users: [], hashtags: [] });
      setShowAutocomplete(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQ)}`);
        const data = await res.json() as { users: any[], hashtags: any[], success: boolean };
        if (data.success) {
          setAutocompleteResults({ users: data.users || [], hashtags: data.hashtags || [] });
          if (data.users && data.users.length > 0) {
            setFollowingMap(prev => {
              const next = { ...prev };
              data.users.forEach(u => {
                if (u.isFollowing !== undefined) {
                  next[u.id] = u.isFollowing;
                }
              });
              return next;
            });
          }
          setShowAutocomplete(true);
        }
      } catch {}
    }, 300);
  }, [searchQ]);

  useEffect(() => {
    if (leftSearchQ.length < 2) {
      setLeftAutocompleteResults({ users: [] });
      setShowLeftAutocomplete(false);
      return;
    }
    if (leftSearchTimeoutRef.current) clearTimeout(leftSearchTimeoutRef.current);
    leftSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(leftSearchQ)}`);
        const data = await res.json();
        if (data.success) {
          setLeftAutocompleteResults({ users: data.users || [] });
          setShowLeftAutocomplete(true);
        }
      } catch {}
    }, 300);
  }, [leftSearchQ]);

  useEffect(() => {
    if ('Notification' in window) Notification.requestPermission();
    const pingHeartbeat = () => fetch('/api/users/heartbeat', { method: 'POST' }).catch(() => {});
    pingHeartbeat();
    const heartbeatInterval = setInterval(pingHeartbeat, 30000);
    const es = new EventSource('/api/trends/stream');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'trends' && data.trends) setTrending(data.trends);
      } catch {}
    };
    return () => { clearInterval(heartbeatInterval); es.close(); };
  }, []);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then((d: { users?: SuggestedUser[] }) => {
      const users = d.users || [];
      setSuggestedUsers(users);
      const fm: Record<string, boolean> = {};
      users.forEach(u => { fm[u.id] = u.isFollowing; });
      setFollowingMap(fm);
    }).catch(() => {});
  }, []);

  const handleFollow = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      const data = await res.json() as { following: boolean };
      setFollowingMap(prev => ({ ...prev, [userId]: data.following }));
      if (data.following) setTimeout(() => setSuggestedUsers(prev => prev.filter(u => u.id !== userId)), 800);
    } catch {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/explore?q=${encodeURIComponent(searchQ.trim())}`);
  };

  // Twitter/X primary nav — top 8 most used
  const primaryNav = [
    { name: t('home'), href: '/dashboard', icon: Home },
    { name: t('explore'), href: '/explore', icon: Hash },
    { name: t('notifications'), href: '/notification', icon: Bell },
    { name: t('messages'), href: '/messages', icon: MessageSquare },
    { name: t('bookmarks'), href: '/bookmarks', icon: Bookmark },
    { name: t('premium'), href: '/premium', icon: Star },
    { name: t('profile'), href: '/profile', icon: User },
    { name: t('more'), href: '#', icon: MoreHorizontal },
  ];

  // Secondary items accessible via "More" or direct URL
  const moreNav = [
    { name: 'Lists', href: '/lists', icon: List },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Grok', href: '/grok', icon: Sparkles },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Creator Studio', href: '/creator-studio', icon: BarChart2 },
    { name: 'Topics', href: '/topics', icon: Hash },
    { name: 'Circle', href: '/circle', icon: Users },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const allNavItems = [...primaryNav.filter(i => i.href !== '#'), ...moreNav];
  const pageTitle = allNavItems.find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))?.name
    || (pathname === '/dashboard' ? 'Home' : '');

  const avatarBg = 'linear-gradient(135deg, #1d9bf0, #7856ff)';
  const avatarInitial = (currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="x-layout">
      <KeyboardShortcuts />

      {/* ─── Left Sidebar ─── */}
      <aside className="x-sidebar">
        {/* Wordmark: Logo + Brand Name */}
        <Link
          href="/dashboard"
          style={{
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: 'fit-content',
            borderRadius: '14px',
            marginTop: '4px',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          className="x-nav-item"
        >
          <Logo size={40} />
          <span className="x-nav-label x-sidebar-wordmark-text" style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
          }}>
            Anti-Tweet
          </span>
        </Link>

        {/* Primary Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          {primaryNav.map((item) => {
            if (item.href === '#') return null;
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link key={item.href} href={item.href} className={`x-nav-item ${isActive ? 'active' : ''}`}>
                <div style={{ position: 'relative' }}>
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                  {item.href === '/notification' && unreadNotificationCount > 0 && (
                    <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--accent)', color: 'white', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unreadNotificationCount}</span>
                  )}
                  {item.href === '/messages' && unreadMessageCount > 0 && (
                    <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--accent)', color: 'white', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unreadMessageCount}</span>
                  )}
                </div>
                <span className="x-nav-label">{item.name}</span>
              </Link>
            );
          })}

          {/* More dropdown trigger */}
          <div style={{ position: 'relative' }} ref={moreMenuRef}>
            <button
              className="x-nav-item"
              style={{ border: 'none', background: isMoreOpen ? 'var(--nav-hover)' : 'transparent', cursor: 'pointer', color: 'var(--foreground)', font: 'inherit', width: 'fit-content' }}
              onClick={() => setIsMoreOpen(v => !v)}
            >
              <MoreHorizontal size={26} strokeWidth={2} />
              <span className="x-nav-label">More</span>
            </button>
            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                    width: '280px', background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)', borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 100,
                  }}
                >
                  {moreNav.map(item => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '14px 16px', textDecoration: 'none',
                          color: isActive ? 'var(--accent)' : 'var(--foreground)',
                          fontWeight: isActive ? 700 : 400, fontSize: '1rem',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        {item.name}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Post Button */}
        <button className="x-post-btn" style={{ marginTop: '16px', marginBottom: '4px' }} onClick={() => setIsTweetModalOpen(true)}>
          <Feather size={24} className="x-post-icon" style={{ display: 'none' }} />
          <span className="x-post-label">Post</span>
        </button>

        {/* Left Sidebar Search / Who to Follow */}
        <div style={{ marginTop: '16px', position: 'relative' }}>
          <form onSubmit={(e) => { e.preventDefault(); if (leftSearchQ.trim()) router.push(`/explore?q=${encodeURIComponent(leftSearchQ.trim())}`); }} className="x-search-wrap" style={{ marginTop: 0 }}>
            <Search className="x-search-icon" size={19} />
            <input
              type="text"
              value={leftSearchQ}
              onChange={e => setLeftSearchQ(e.target.value)}
              onFocus={() => { if (leftSearchQ.length >= 2) setShowLeftAutocomplete(true); }}
              onBlur={() => setTimeout(() => setShowLeftAutocomplete(false), 200)}
              placeholder="Search who to follow"
              className="x-search-input"
              style={{ padding: '10px 16px 10px 48px', fontSize: '0.9rem' }}
            />
          </form>
          
          <AnimatePresence>
            {showLeftAutocomplete && leftAutocompleteResults.users.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px',
                  overflow: 'hidden', zIndex: 60, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', padding: '8px 16px' }}>USERS TO FOLLOW</div>
                {leftAutocompleteResults.users.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Link href={`/profile/${u.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <div className="x-avatar" style={{ background: avatarBg, width: 32, height: 32, fontSize: '0.8rem' }}>
                        {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{u.username}</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleFollow(u.id)}
                      className={`x-follow-btn ${followingMap[u.id] ? 'following' : 'follow'}`}
                      style={{ padding: '4px 12px', fontSize: '0.75rem', marginLeft: 'auto' }}
                    >
                      {followingMap[u.id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account Menu */}
        <div style={{ marginTop: '12px', paddingBottom: '12px', position: 'relative' }} ref={accountMenuRef}>
          <AnimatePresence>
            {isAccountMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                  width: '300px', background: 'var(--background)', border: '1px solid var(--card-border)',
                  borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  overflow: 'hidden', zIndex: 50,
                }}
              >
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div className="x-avatar" style={{ background: currentUser?.avatar ? `url(${currentUser.avatar}) center/cover` : avatarBg }}>
                      {!currentUser?.avatar && avatarInitial}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        @{currentUser?.username || currentUser?.email?.split('@')[0]}
                      </div>
                    </div>
                  </div>
                  <Check size={18} color="#1d9bf0" style={{ flexShrink: 0 }} />
                </div>
                <div className="x-divider" />
                <button
                  onClick={() => alert('Coming soon!')}
                  style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '15px', fontWeight: 700, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Add an existing account
                </button>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '15px', fontWeight: 700, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Log out @{currentUser?.username || currentUser?.email?.split('@')[0]}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button className="x-account-btn" onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}>
            <div className="x-avatar" style={{ background: currentUser?.avatar ? `url(${currentUser.avatar}) center/cover` : avatarBg, fontSize: '1rem' }}>
              {!currentUser?.avatar && avatarInitial}
            </div>
            <div className="x-account-info" style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'User') : ''}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser ? `@${currentUser.username || currentUser.email?.split('@')[0]}` : ''}
              </div>
            </div>
            <MoreHorizontal size={20} color="var(--muted)" className="x-account-more" style={{ flexShrink: 0 }} />
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar (hidden on desktop) ─── */}
      <div className="x-mobile-top-bar">
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Logo size={30} />
          <span style={{
            fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.4px',
            background: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 55%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Anti-Tweet</span>
        </Link>
        {/* Right: avatar */}
        <div className="x-avatar" style={{ background: avatarBg, width: 32, height: 32, fontSize: '0.8rem', cursor: 'pointer' }}>
          {avatarInitial}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <main className="x-main">
        {children}
      </main>

      {/* ─── Right Sidebar ─── */}
      <aside className="x-right" style={{ paddingTop: '8px' }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="x-search-wrap">
          <Search className="x-search-icon" size={19} />
          <input
            id="global-search-input"
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onFocus={() => { if (searchQ.length >= 2) setShowAutocomplete(true); }}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            placeholder="Search"
            className="x-search-input"
          />
          {showAutocomplete && (autocompleteResults.users.length > 0 || autocompleteResults.hashtags.length > 0) && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
              background: 'var(--background)', border: '1px solid var(--card-border)', borderRadius: '16px',
              overflow: 'hidden', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
              {autocompleteResults.users.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', padding: '8px 16px' }}>PEOPLE</div>
                  {autocompleteResults.users.map(u => (
                    <Link key={u.id} href={`/profile/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', textDecoration: 'none', color: 'inherit', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="x-avatar" style={{ background: avatarBg, width: 32, height: 32, fontSize: '0.8rem', flexShrink: 0 }}>
                        {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{u.username}</div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFollow(u.id); }}
                        className={`x-follow-btn ${followingMap[u.id] ? 'following' : 'follow'}`}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', marginLeft: 'auto', position: 'relative', zIndex: 10, flexShrink: 0 }}
                      >
                        {followingMap[u.id] ? 'Following' : 'Follow'}
                      </button>
                    </Link>
                  ))}
                </div>
              )}
              {autocompleteResults.hashtags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', padding: '8px 16px' }}>HASHTAGS</div>
                  {autocompleteResults.hashtags.map(h => (
                    <Link key={h.id} href={`/hashtag/${h.tag}`} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: 'inherit', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>#{h.tag}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{h.count} posts</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* What's Happening */}
        {trending.length > 0 && (
          <div className="x-widget">
            <h3 className="x-widget-title">What's happening</h3>
            {trending.slice(0, 5).map((item, i) => (
              <Link key={item.tag} href={`/explore?q=${encodeURIComponent('#' + item.tag)}`} className="x-trend-item">
                <div className="x-trend-meta">{i + 1} · Trending</div>
                <div className="x-trend-tag">#{item.tag}</div>
                <div className="x-trend-meta">{item.count.toLocaleString()} posts</div>
              </Link>
            ))}
            <Link href="/explore" className="x-trend-item" style={{ color: 'var(--accent)', fontWeight: 500 }}>
              Show more
            </Link>
          </div>
        )}

        {/* Who to Follow */}
        {suggestedUsers.length > 0 && (
          <div className="x-widget" style={{ marginTop: 12 }}>
            <h3 className="x-widget-title">Who to follow</h3>
            {suggestedUsers.slice(0, 3).map(u => (
              <div key={u.id} className="x-follow-item">
                <Link href={`/profile/${u.id}`}>
                  <div className="x-avatar" style={{ background: avatarBg }}>
                    {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </Link>
                <Link href={`/profile/${u.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.displayName || u.email?.split('@')[0]}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username ? `@${u.username}` : u.email?.split('@')[0]}
                  </div>
                </Link>
                <button
                  onClick={() => handleFollow(u.id)}
                  className={`x-follow-btn ${followingMap[u.id] ? 'following' : 'follow'}`}
                >
                  {followingMap[u.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
            <Link href="/explore" className="x-trend-item" style={{ color: 'var(--accent)', fontWeight: 500 }}>
              Show more
            </Link>
          </div>
        )}

        {/* Footer links */}
        <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Accessibility', 'Ads info', 'More'].map(item => (
            <a key={item} href="#" style={{ color: 'var(--muted)', fontSize: '0.8125rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              {item}
            </a>
          ))}
          <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>© 2024 Anti-Tweet</span>
        </div>
      </aside>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="x-mobile-nav">
        {primaryNav.slice(0, 5).map(item => {
          if (item.href === '#') return null;
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          const badge =
            item.href === '/notification' ? unreadNotificationCount :
            item.href === '/messages'     ? unreadMessageCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '8px 16px',
                color: isActive ? 'var(--foreground)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', flex: 1,
                borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: '6px', right: 'calc(50% - 18px)',
                  background: 'var(--accent)', color: 'white', borderRadius: '9999px',
                  fontSize: '0.65rem', fontWeight: 700, minWidth: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─── Mobile FAB: Compose button ─── */}
      <button
        className="x-mobile-fab"
        onClick={() => setIsTweetModalOpen(true)}
        aria-label="Create post"
      >
        <Feather size={22} />
      </button>

      <TweetModal
        isOpen={isTweetModalOpen}
        onClose={() => setIsTweetModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealTimeProvider>
      <AuthenticatedLayoutInner>{children}</AuthenticatedLayoutInner>
    </RealTimeProvider>
  );
}
