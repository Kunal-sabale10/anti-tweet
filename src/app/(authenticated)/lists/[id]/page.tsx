"use client";
import { useState, useEffect, use, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserPlus, X, Lock, Users, Heart, MessageCircle, Repeat2, Bookmark, Search } from 'lucide-react';
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
  return `${Math.floor(hrs / 24)}d`;
}

interface ListMember {
  id: string;
  user: PublicUser & { subscription?: string };
}

interface UserList {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  owner: PublicUser & { subscription?: string };
  members: ListMember[];
}

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [list, setList] = useState<UserList | null>(null);
  const [tweets, setTweets] = useState<TweetFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'feed' | 'members'>('feed');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();
  
  // Add member modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile').then(r => r.json()).then(d => { if(d.id) setMyUserId(d.id); });
    
    const fetchAll = async () => {
      try {
        const [listRes, feedRes] = await Promise.all([
          fetch(`/api/lists/${id}`),
          fetch(`/api/lists/${id}/feed`)
        ]);
        if (!listRes.ok) {
          router.push('/lists');
          return;
        }
        const listData = await listRes.json();
        const feedData = await feedRes.json();
        setList(listData.list);
        setTweets(feedData.tweets || []);
        setCursor(feedData.nextCursor || null);
        setHasMore(feedData.nextCursor !== null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, router]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || !hasMore || tab !== 'feed') return;
    try {
      setLoadingMore(true);
      const res = await fetch(`/api/lists/${id}/feed?cursor=${cursor}`);
      if (!res.ok) throw new Error('Failed to load more');
      const data = await res.json();
      setTweets(prev => [...prev, ...(data.tweets || [])]);
      setCursor(data.nextCursor || null);
      setHasMore(data.nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [id, cursor, loadingMore, hasMore, tab]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading && tab === 'feed') {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, loading, tab, loadMore]);

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/lists/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      
      // Update local state
      if (!list) return;
      if (data.added) {
        // We'd need the full user object ideally, but for now we'll just refetch the list
        const listRes = await fetch(`/api/lists/${id}`);
        const listData = await listRes.json();
        setList(listData.list);
      } else {
        setList({
          ...list,
          members: list.members.filter(m => m.user.id !== userId)
        });
      }
    } catch { /* ignore */ }
  };

  const isOwner = myUserId && list?.ownerId === myUserId;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
  if (!list) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--card-border)',
        position: 'sticky', top: 0,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '1.5rem',
      }}>
        <button onClick={() => router.back()} className="icon-btn-back" style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{list.name}</h2>
            {list.isPrivate && <Lock size={14} color="var(--muted)" />}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            @{list.owner.username || list.owner.email?.split('@')[0]}
          </span>
        </div>
      </div>

      {/* List Info Cover */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'linear-gradient(135deg, var(--card-bg), rgba(255,255,255,0.05))', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--foreground)' }}>
          <Users size={32} />
        </div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900 }}>{list.name}</h1>
        {list.description && <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '400px' }}>{list.description}</p>}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          <span><strong style={{ color: 'var(--foreground)' }}>{list.members.length}</strong> Members</span>
        </div>
        {isOwner && (
          <button onClick={() => setAddModalOpen(true)} className="btn" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--card-border)', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '9999px', fontWeight: 700, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <UserPlus size={16} /> Manage Members
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
        <button 
          onClick={() => setTab('feed')}
          style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: tab === 'feed' ? 'var(--foreground)' : 'var(--muted)', fontWeight: tab === 'feed' ? 700 : 500, cursor: 'pointer', position: 'relative', transition: 'color 0.2s' }}
        >
          Tweets
          {tab === 'feed' && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '4px', background: 'var(--accent)', borderRadius: '4px 4px 0 0' }} />}
        </button>
        <button 
          onClick={() => setTab('members')}
          style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: tab === 'members' ? 'var(--foreground)' : 'var(--muted)', fontWeight: tab === 'members' ? 700 : 500, cursor: 'pointer', position: 'relative', transition: 'color 0.2s' }}
        >
          Members
          {tab === 'members' && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '4px', background: 'var(--accent)', borderRadius: '4px 4px 0 0' }} />}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {tab === 'feed' ? (
          <div>
            {tweets.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No posts yet</p>
                <p style={{ fontSize: '0.9rem' }}>Posts from list members will appear here.</p>
              </div>
            ) : (
              tweets.map(tweet => (
                <div key={tweet.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.75rem' }}>
                  <Link href={`/profile/${tweet.user?.id}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                      {tweet.user?.avatar ? <img src={tweet.user.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (tweet.user?.displayName || tweet.user?.email || 'A').charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <Link href={`/profile/${tweet.user?.id}`} style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        {tweet.user?.displayName || tweet.user?.email?.split('@')[0]}
                        <VerifiedBadge subscription={tweet.user?.subscription} />
                      </Link>
                      <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>@{tweet.user?.username || tweet.user?.email?.split('@')[0]}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>· {timeAgo(tweet.createdAt)}</span>
                    </div>
                    <Link href={`/tweet/${tweet.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <TweetText content={tweet.content || ''} />
                      </div>
                      {tweet.imageUrl && (
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', marginBottom: '0.5rem' }}>
                          <img src={tweet.imageUrl} alt="" style={{ width: '100%', display: 'block' }} />
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
              ))
            )}
            {tweets.length > 0 && hasMore && cursor && (
              <div ref={ref} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                Loading more...
              </div>
            )}
          </div>
        ) : (
          <div>
            {list.members.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No members</p>
                {isOwner && <p style={{ fontSize: '0.9rem' }}>Add people to this list to see their posts.</p>}
              </div>
            ) : (
              list.members.map(member => (
                <div key={member.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Link href={`/profile/${member.user.id}`}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                        {member.user.avatar ? <img src={member.user.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (member.user.displayName || member.user.email || 'A').charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/profile/${member.user.id}`} style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        {member.user.displayName || member.user.email?.split('@')[0]}
                        <VerifiedBadge subscription={member.user.subscription} />
                      </Link>
                      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>@{member.user.username || member.user.email?.split('@')[0]}</div>
                    </div>
                  </div>
                  {isOwner && member.user.id !== myUserId && (
                    <button onClick={() => toggleMember(member.user.id)} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', borderRadius: '9999px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 700 }}>
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div
            className="modal-sheet"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setAddModalOpen(false); }}
          >
            <motion.div
              className="modal-panel"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Manage Members</h3>
                <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '50%' }} className="icon-btn">
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                <Search size={18} color="var(--muted)" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search people to add..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', fontSize: '1rem' }}
                />
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {searching ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                    {searchQuery ? 'No users found.' : 'Search for users to add them to this list.'}
                  </div>
                ) : (
                  searchResults.map(user => {
                    const isMember = list.members.some(m => m.user.id === user.id);
                    return (
                      <div key={user.id} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                            {user.avatar ? <img src={user.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
                              {user.displayName || user.email?.split('@')[0]}
                              <VerifiedBadge subscription={user.subscription} />
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>@{user.username || user.email?.split('@')[0]}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleMember(user.id)}
                          className="btn"
                          style={{ 
                            padding: '0.3rem 1rem', fontSize: '0.85rem', borderRadius: '9999px', fontWeight: 700,
                            background: isMember ? 'transparent' : 'white',
                            color: isMember ? 'var(--foreground)' : '#0f172a',
                            border: isMember ? '1px solid var(--card-border)' : 'none'
                          }}
                        >
                          {isMember ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .icon-btn-back:hover { background: rgba(255,255,255,0.1) !important; }
        .icon-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>
    </div>
  );
}
