'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2, Edit3, Pin, PinOff, EyeOff, BarChart2 } from 'lucide-react';

interface TweetMenuProps {
  tweetId: string;
  isOwner: boolean;
  subscription?: string;
  createdAt: string;
  isPinned?: boolean;
  onDeleted?: () => void;
  onEdited?: (newContent: string) => void;
  onPinned?: (pinned: boolean) => void;
}

export default function TweetMenu({ tweetId, isOwner, subscription, createdAt, isPinned, onDeleted, onEdited, onPinned }: TweetMenuProps) {
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Can edit within 1 hour and only Premium
  const canEdit = isOwner && (subscription === 'BLUE' || subscription === 'GOLD') &&
    (Date.now() - new Date(createdAt).getTime()) < 60 * 60 * 1000;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/tweets/${tweetId}`, { method: 'DELETE' });
      if (res.ok) onDeleted?.();
      else alert('Failed to delete post.');
    } catch { alert('Error deleting post.'); }
    finally { setDeleting(false); }
  };

  const handlePin = async () => {
    setOpen(false);
    try {
      const res = await fetch(`/api/tweets/${tweetId}/pin`, { method: 'POST' });
      const data = await res.json();
      onPinned?.(data.pinned);
    } catch { alert('Failed to pin post.'); }
  };

  const handleEditOpen = () => {
    setOpen(false);
    // Pre-fill - in real app we'd have tweet content here
    setEditContent('');
    setShowEdit(true);
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/tweets/${tweetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (res.ok) {
        onEdited?.(editContent);
        setShowEdit(false);
      } else {
        alert(data.error || 'Failed to edit.');
      }
    } catch { alert('Error editing post.'); }
    finally { setEditing(false); }
  };

  const handleAnalytics = async () => {
    setOpen(false);
    try {
      const res = await fetch(`/api/tweets/${tweetId}/analytics`);
      const data = await res.json();
      if (res.ok) { setAnalytics(data.analytics); setShowAnalytics(true); }
      else alert('Analytics not available.');
    } catch { alert('Error loading analytics.'); }
  };

  const handleNotInterested = () => {
    setOpen(false);
    // Store in localStorage to filter client-side
    const hidden = JSON.parse(localStorage.getItem('hiddenTweets') || '[]') as string[];
    if (!hidden.includes(tweetId)) {
      localStorage.setItem('hiddenTweets', JSON.stringify([...hidden, tweetId]));
    }
    onDeleted?.(); // Re-use deletion callback to remove from feed
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(o => !o); }}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
        className="tweet-menu-btn"
        title="More options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 100,
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '16px', padding: '0.4rem', minWidth: '200px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
        }}>
          {/* Owner actions */}
          {isOwner && (
            <>
              <button onClick={handleDelete} disabled={deleting} className="menu-item menu-item-danger">
                <Trash2 size={16} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>{deleting ? 'Deleting...' : 'Delete post'}</span>
              </button>
              {canEdit && (
                <button onClick={handleEditOpen} className="menu-item">
                  <Edit3 size={16} /> Edit post
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 'auto' }}>Premium only</span>
                </button>
              )}
              <button onClick={handlePin} className="menu-item">
                {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                {isPinned ? 'Unpin post' : 'Pin to profile'}
              </button>
              <button onClick={handleAnalytics} className="menu-item">
                <BarChart2 size={16} /> View analytics
              </button>
              <div style={{ height: '1px', background: 'var(--card-border)', margin: '0.4rem 0' }} />
            </>
          )}

          {/* Everyone actions */}
          {!isOwner && (
            <button onClick={handleNotInterested} className="menu-item">
              <EyeOff size={16} /> Not interested in this
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowEdit(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '520px', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 800 }}>✏️ Edit Post</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>Premium edit — changes are permanent and visible to everyone.</p>
            <textarea
              className="input-field"
              placeholder="New content..."
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={4}
              style={{ width: '100%', resize: 'vertical', marginBottom: '1rem' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEdit(false)} className="btn btn-secondary" disabled={editing}>Cancel</button>
              <button onClick={handleEditSubmit} className="btn btn-primary" disabled={editing || !editContent.trim()}>
                {editing ? 'Saving...' : 'Save edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowAnalytics(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '480px', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={20} /> Post Analytics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[
                { label: 'Impressions', value: analytics.impressions?.toLocaleString(), icon: '👁️' },
                { label: 'Engagements', value: analytics.engagements?.toLocaleString(), icon: '⚡' },
                { label: 'Profile Clicks', value: analytics.profileClicks?.toLocaleString(), icon: '👤' },
                { label: 'Link Clicks', value: analytics.linkClicks?.toLocaleString(), icon: '🔗' },
                { label: 'Likes', value: analytics.likeCount?.toLocaleString(), icon: '❤️' },
                { label: 'Replies', value: analytics.replyCount?.toLocaleString(), icon: '💬' },
                { label: 'Reposts', value: analytics.retweetCount?.toLocaleString(), icon: '🔁' },
                { label: 'Bookmarks', value: analytics.bookmarkCount?.toLocaleString(), icon: '🔖' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{stat.value ?? '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            {analytics.engagementRate && (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                Engagement Rate: <strong style={{ color: 'var(--foreground)' }}>{analytics.engagementRate}</strong>
              </div>
            )}
            <button onClick={() => setShowAnalytics(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
          </div>
        </div>
      )}

      <style>{`
        .tweet-menu-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .menu-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.9rem; border-radius: 10px; background: none; border: none; color: var(--foreground); cursor: pointer; width: 100%; text-align: left; font-size: 0.9rem; font-weight: 500; transition: background 0.15s; }
        .menu-item:hover { background: rgba(255,255,255,0.06); }
        .menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
      `}</style>
    </div>
  );
}
