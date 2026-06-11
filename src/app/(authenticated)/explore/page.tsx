"use client";
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MoreHorizontal, Settings, ArrowLeft, Heart, MessageSquare
} from 'lucide-react';
import type { TweetFeedItem, PublicUser } from '@/lib/types';

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

function getAvatarGradient(email: string | null) {
  const palettes = [
    ['#3b82f6', '#8b5cf6'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#8b5cf6'],
    ['#14b8a6', '#60a5fa'],
  ];
  return palettes[((email || '').charCodeAt(0) || 0) % palettes.length];
}

type SearchTab = 'top' | 'latest' | 'people';
type ExploreTab = 'For you' | 'Trending' | 'News' | 'Sports' | 'Entertainment';
interface TrendingTag { tag: string; count: number }

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({
  user,
  isFollowing,
  onFollow,
}: {
  user: PublicUser;
  isFollowing: boolean;
  onFollow: () => void;
}) {
  const [colors] = useState(() => getAvatarGradient(user.email));
  const label = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="x-follow-item" style={{ borderBottom: '1px solid var(--card-border)', padding: '12px 16px' }}>
      <Link href={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
        <div className="x-avatar" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
          {label}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="name-hover">
            {user.displayName || user.email?.split('@')[0]}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.username ? `@${user.username}` : user.email}
          </div>
          {user.bio && (
            <div style={{ fontSize: '0.9375rem', marginTop: '4px', color: 'var(--foreground)' }}>
              {user.bio}
            </div>
          )}
        </div>
      </Link>
      <button
        onClick={onFollow}
        className={`x-follow-btn ${isFollowing ? 'following' : 'follow'}`}
        style={{ marginLeft: '12px' }}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      <style jsx>{`
        .name-hover:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

// ─── Tweet Card ───────────────────────────────────────────────────────────────
function TweetResult({ tweet }: { tweet: TweetFeedItem }) {
  const colors = getAvatarGradient(tweet.user?.email ?? null);
  const label = (tweet.user?.displayName || tweet.user?.email || 'A').charAt(0).toUpperCase();

  return (
    <div className="tweet-card" style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '12px', cursor: 'pointer', transition: 'background 0.15s' }}>
      <Link href={tweet.user?.id ? `/profile/${tweet.user.id}` : '#'} className="x-avatar" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, textDecoration: 'none' }}>
        {label}
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
          <Link href={tweet.user?.id ? `/profile/${tweet.user.id}` : '#'} style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--foreground)', textDecoration: 'none' }} className="name-hover">
            {tweet.user?.displayName || tweet.user?.email?.split('@')[0]}
          </Link>
          {tweet.user?.username && (
            <span style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>@{tweet.user.username}</span>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>· {timeAgo(tweet.createdAt)}</span>
        </div>
        {tweet.content && (
          <p style={{ color: 'var(--foreground)', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {tweet.content}
          </p>
        )}
        <div style={{ display: 'flex', gap: '32px', marginTop: '12px', color: 'var(--muted)', fontSize: '0.8125rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} className="action-btn reply">
            <MessageSquare size={16} />
            {tweet.replyCount > 0 ? tweet.replyCount : ''}
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: tweet.likedByMe ? '#f91880' : 'inherit', cursor: 'pointer' }} className="action-btn like">
            <Heart size={16} fill={tweet.likedByMe ? '#f91880' : 'none'} style={{ color: tweet.likedByMe ? '#f91880' : 'inherit' }} />
            {tweet.likeCount > 0 ? tweet.likeCount : ''}
          </button>
        </div>
      </div>
      <style jsx>{`
        .name-hover:hover { text-decoration: underline; }
        .action-btn { transition: color 0.15s; }
        .reply:hover { color: var(--accent); }
        .like:hover { color: #f91880; }
      `}</style>
    </div>
  );
}

// ─── Tab Component ────────────────────────────────────────────────────────────
function XTabs({ tabs, activeTab, onTabSelect }: { tabs: string[]; activeTab: string; onTabSelect: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--card-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }} className="hide-scrollbar">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onTabSelect(t)}
          style={{
            flex: '1 0 auto', padding: '0 16px', background: 'none', border: 'none',
            color: activeTab === t ? 'var(--foreground)' : 'var(--muted)',
            fontWeight: activeTab === t ? 700 : 500, cursor: 'pointer',
            fontSize: '0.9375rem', fontFamily: 'inherit',
            transition: 'background 0.15s', height: '53px', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          className="x-tab-btn"
        >
          {t}
          {activeTab === t && (
            <motion.div
              layoutId="activeTabIndicator"
              style={{ position: 'absolute', bottom: 0, height: '4px', background: 'var(--accent)', borderRadius: '9999px', width: '100%' }}
            />
          )}
        </button>
      ))}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .x-tab-btn:hover { background: var(--hover-bg); }
      `}</style>
    </div>
  );
}

// ─── Inner Component ──────────────────────────────────────────────────────────
function ExploreInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  
  const [searchTab, setSearchTab] = useState<SearchTab>('top');
  const [exploreTab, setExploreTab] = useState<ExploreTab>('For you');
  
  const [tweets, setTweets] = useState<TweetFeedItem[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [searching, setSearching] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { tweets: TweetFeedItem[]; users: PublicUser[]; trending: TrendingTag[] };
      setTweets(data.tweets || []);
      setUsers(data.users || []);
      setTrending(data.trending || []);
      const fm: Record<string, boolean> = {};
      (data.users || []).forEach(u => { fm[u.id] = u.isFollowing; });
      setFollowingMap(fm);
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  }, []);

  // Fetch initial data (either search results or trends)
  useEffect(() => { doSearch(activeQuery); }, [activeQuery, doSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setActiveQuery(query.trim());
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveQuery('');
    router.push('/explore');
  };

  const handleFollow = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      const data = await res.json() as { following: boolean };
      setFollowingMap(prev => ({ ...prev, [userId]: data.following }));
    } catch { /* ignore */ }
  };

  const hasSearchMode = activeQuery.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderBottom: hasSearchMode ? 'none' : '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '53px', gap: '16px' }}>
          {hasSearchMode && (
            <button onClick={handleClearSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', padding: '8px', borderRadius: '50%', marginLeft: '-8px' }} className="back-btn">
              <ArrowLeft size={20} />
            </button>
          )}
          
          <form onSubmit={handleSearchSubmit} className="x-search-wrap" style={{ flex: 1, marginTop: 0 }}>
            <Search className="x-search-icon" size={19} color={isFocused ? 'var(--accent)' : 'var(--muted)'} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search"
              className="x-search-input"
              style={{
                background: isFocused ? 'var(--background)' : 'rgba(255,255,255,0.06)',
                borderColor: isFocused ? 'var(--accent)' : 'transparent',
                paddingTop: '10px', paddingBottom: '10px'
              }}
            />
          </form>
          
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', padding: '8px', borderRadius: '50%' }} className="settings-btn">
            <Settings size={20} />
          </button>
        </div>

        {/* Tabs */}
        {hasSearchMode ? (
          <XTabs tabs={['Top', 'Latest', 'People', 'Media', 'Lists']} activeTab={searchTab === 'top' ? 'Top' : searchTab === 'latest' ? 'Latest' : 'People'} onTabSelect={(t) => setSearchTab(t.toLowerCase() as SearchTab)} />
        ) : (
          <XTabs tabs={['For you', 'Trending', 'News', 'Sports', 'Entertainment']} activeTab={exploreTab} onTabSelect={(t) => setExploreTab(t as ExploreTab)} />
        )}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {searching ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid var(--card-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </motion.div>
        ) : hasSearchMode ? (
          /* ── Search Results ── */
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {users.length === 0 && tweets.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9375rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--foreground)', marginBottom: '8px' }}>No results for "{activeQuery}"</div>
                The term you entered did not bring up any results.
              </div>
            ) : (
              <div>
                {(searchTab === 'top' || searchTab === 'people') && users.length > 0 && (
                  <div>
                    {searchTab === 'top' && <div style={{ fontWeight: 800, fontSize: '1.25rem', padding: '12px 16px' }}>People</div>}
                    {users.map(u => (
                      <UserCard key={u.id} user={u} isFollowing={followingMap[u.id] ?? u.isFollowing} onFollow={() => handleFollow(u.id)} />
                    ))}
                    {searchTab === 'top' && <Link href="#" onClick={(e) => { e.preventDefault(); setSearchTab('people'); }} className="x-trend-item" style={{ color: 'var(--accent)' }}>View all</Link>}
                    {searchTab === 'top' && <div style={{ height: '1px', background: 'var(--card-border)' }} />}
                  </div>
                )}
                
                {(searchTab === 'top' || searchTab === 'latest') && tweets.length > 0 && (
                  <div>
                    {tweets.map(t => <TweetResult key={t.id} tweet={t} />)}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Explore/Trending ── */
          <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', padding: '12px 16px' }}>
              {exploreTab === 'Trending' ? 'United States trends' : 'Trending'}
            </div>
            
            {trending.length === 0 ? (
              <div style={{ padding: '32px 16px', color: 'var(--muted)', textAlign: 'center', fontSize: '0.9375rem' }}>
                No trends happening right now.
              </div>
            ) : (
              trending.map((t, i) => (
                <div key={t.tag} className="x-trend-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <Link href={`/explore?q=${encodeURIComponent('#' + t.tag)}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <div className="x-trend-meta">
                      {i + 1} · {exploreTab === 'Sports' ? 'Sports' : exploreTab === 'Entertainment' ? 'Entertainment' : 'Trending'}
                    </div>
                    <div className="x-trend-tag" style={{ margin: '2px 0' }}>#{t.tag}</div>
                    <div className="x-trend-meta">{t.count.toLocaleString()} posts</div>
                  </Link>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', padding: '8px', borderRadius: '50%', cursor: 'pointer', height: 'fit-content' }} className="settings-btn">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .back-btn:hover, .settings-btn:hover { background: var(--hover-bg) !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--card-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ExploreInner />
    </Suspense>
  );
}
