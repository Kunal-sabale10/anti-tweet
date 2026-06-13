"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, UserPlus, Quote, Check, CheckCheck, Bell, AtSign, BadgeCheck } from 'lucide-react';
import type { NotificationItem } from '@/lib/types';
import { useRealTime } from '@/components/RealTimeProvider';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ user, size = 42 }: { user: NotificationItem['fromUser']; size?: number }) {
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

const NotifIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'LIKE': return <Heart fill="#ef4444" color="#ef4444" size={24} />;
    case 'REPLY': return <MessageCircle fill="#3b82f6" color="#3b82f6" size={24} />;
    case 'FOLLOW': return <UserPlus fill="#8b5cf6" color="#8b5cf6" size={24} />;
    case 'RETWEET': return <Repeat2 color="#10b981" size={24} strokeWidth={3} />;
    case 'QUOTE': return <Quote fill="#14b8a6" color="#14b8a6" size={24} />;
    default: return <Bell fill="#6b7280" color="#6b7280" size={24} />;
  }
};

const NotifText = ({ n }: { n: NotificationItem }) => {
  const name = <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{n.fromUser.displayName || n.fromUser.email?.split('@')[0]}</span>;
  switch (n.type) {
    case 'LIKE': return <>{name} liked your post</>;
    case 'REPLY': return <>{name} replied to your post</>;
    case 'FOLLOW': return <>{name} followed you</>;
    case 'RETWEET': return <>{name} reposted your tweet</>;
    case 'QUOTE': return <>{name} quoted your tweet</>;
    default: return <>{name} interacted with you</>;
  }
};

type NotifTab = 'all' | 'mentions' | 'verified';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifTab, setNotifTab] = useState<NotifTab>('all');
  const esRef = useRef<EventSource | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json() as { notifications?: NotificationItem[] };
      setNotifications(data.notifications || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  const { newNotifications, clearNewNotifications, resetUnreadNotifications } = useRealTime();

  useEffect(() => {
    resetUnreadNotifications();
  }, [resetUnreadNotifications]);

  useEffect(() => {
    if (newNotifications.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = newNotifications.filter(n => !existingIds.has(n.id));
        return [...newOnes, ...prev];
      });
      clearNewNotifications();
    }
  }, [newNotifications, clearNewNotifications]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifs = notifications.filter(n => {
    if (notifTab === 'mentions') return n.type === 'MENTION';
    if (notifTab === 'verified') return ['LIKE', 'RETWEET', 'QUOTE'].includes(n.type);
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: 'none', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--card-border)', display: 'flex' }}>
        {([{ key: 'all', label: 'All', icon: <Bell size={14} /> }, { key: 'mentions', label: 'Mentions', icon: <AtSign size={14} /> }, { key: 'verified', label: 'Engagements', icon: <BadgeCheck size={14} /> }] as { key: NotifTab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setNotifTab(t.key)}
            style={{
              flex: 1, padding: '1rem 0.5rem', background: 'none', border: 'none',
              borderBottom: notifTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: notifTab === t.key ? 'var(--foreground)' : 'var(--muted)',
              fontWeight: notifTab === t.key ? 700 : 400,
              fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: 'var(--space-4)', opacity: 0.5 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: 12, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 12, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))
        ) : filteredNotifs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <Bell size={48} style={{ opacity: 0.15, display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nothing to see here — yet</p>
            <p style={{ fontSize: '0.9rem' }}>When someone interacts with you or your posts, you&apos;ll find it here.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifs.map(n => {
              const linkUrl = n.type === 'FOLLOW' ? `/profile/${n.fromUser.id}` : (n.tweetId ? `/tweet/${n.tweetId}` : '#');
              
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, backgroundColor: n.read ? 'transparent' : 'rgba(59,130,246,0.1)' }}
                  animate={{ opacity: 1, backgroundColor: n.read ? 'transparent' : 'rgba(59,130,246,0.1)' }}
                  style={{
                    borderBottom: '1px solid var(--card-border)',
                    transition: 'background-color 0.5s',
                  }}
                >
                  <Link href={linkUrl} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4)' }} className="notif-hover">
                    <div style={{ width: 32, display: 'flex', justifyContent: 'flex-end', paddingTop: '0.2rem' }}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Avatar user={n.fromUser} size={32} />
                      <div style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: 'var(--muted)' }}>
                        <NotifText n={n} />
                      </div>
                      {n.previewText && (
                        <p style={{ color: 'var(--foreground)', margin: '0.4rem 0 0', fontSize: '0.95rem', lineHeight: 1.4, opacity: 0.85 }}>
                          {n.previewText}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        .notif-hover:hover { background: rgba(255,255,255,0.02); }
      `}</style>
    </div>
  );
}
