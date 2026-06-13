"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, MessageSquare, ArrowLeft, Users, Check, CheckCheck,
  MoreHorizontal, Phone, Video
} from 'lucide-react';
import type { ConversationItem, MessageItem } from '@/lib/types';
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

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

interface DMUser {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  dmPrivacy: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

function Avatar({
  user,
  size = 44,
}: {
  user: { email?: string | null; displayName?: string | null; username?: string | null } | null | undefined;
  size?: number;
}) {
  const label = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
  const colors = [
    ['#3b82f6', '#8b5cf6'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#8b5cf6'],
    ['#14b8a6', '#60a5fa'],
  ];
  const palette = colors[((user?.email || '').charCodeAt(0) || 0) % colors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: 'white',
        fontSize: size * 0.38,
        flexShrink: 0,
        boxShadow: `0 0 0 2px ${palette[0]}33`,
      }}
    >
      {label}
    </div>
  );
}

// ─── Conversation List Panel ──────────────────────────────────────────────────
function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewDM,
}: {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewDM: () => void;
}) {
  const [filterQ, setFilterQ] = useState('');
  const filtered = conversations.filter(c => {
    const name = (c.otherUser?.displayName || c.otherUser?.email || '').toLowerCase();
    return name.includes(filterQ.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1rem 1rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>Messages</h3>
        <button
          onClick={onNewDM}
          className="btn btn-primary"
          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <MessageSquare size={14} /> New
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            value={filterQ}
            onChange={e => setFilterQ(e.target.value)}
            placeholder="Search conversations…"
            style={{
              width: '100%',
              padding: '0.55rem 1rem 0.55rem 2.25rem',
              background: 'rgba(30,41,59,0.5)',
              border: '1px solid var(--card-border)',
              borderRadius: '9999px',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <MessageSquare size={24} style={{ opacity: 0.4 }} />
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              {conversations.length === 0 ? 'No messages yet' : 'No results'}
            </p>
            <p style={{ fontSize: '0.82rem' }}>
              {conversations.length === 0 ? 'Click "New" to start a conversation' : 'Try a different name'}
            </p>
          </div>
        ) : (
          filtered.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                background: selectedId === c.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft: selectedId === c.id ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background 0.15s',
                fontFamily: 'inherit',
                color: 'var(--foreground)',
              }}
              className="conv-item"
            >
              <Avatar user={c.otherUser} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.otherUser?.displayName || c.otherUser?.email?.split('@')[0] || 'Unknown'}
                  </span>
                  {c.lastMessage && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p style={{
                  color: 'var(--muted)',
                  fontSize: '0.82rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: '0.1rem 0 0',
                }}>
                  {c.lastMessage?.content || 'Start the conversation…'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({
  conversationId,
  otherUser,
  currentUserId,
  onBack,
}: {
  conversationId: string;
  otherUser: ConversationItem['otherUser'];
  currentUserId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/dm/${conversationId}/messages`);
      const data = await res.json() as { messages: MessageItem[] };
      setMessages(data.messages || []);
    } catch { /* ignore */ }
  }, [conversationId]);

  useEffect(() => {
    setMessages([]);
    setText('');
    fetchMessages();

    // SSE stream for incoming messages
    const es = new EventSource(`/api/dm/${conversationId}/stream`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as any;
        if (data.type === 'messages' && data.messages?.length) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const newOnes = data.messages!.filter((m: any) => !ids.has(m.id));
            return newOnes.length ? [...prev, ...newOnes] : prev;
          });
        } else if (data.type === 'typing') {
          if (data.userId === otherUser.id) {
            setIsOtherUserTyping(data.isTyping);
          }
        } else if (data.type === 'read') {
          setMessages(prev => prev.map(m => 
            data.messageIds.includes(m.id) ? { ...m, readAt: data.readAt } : m
          ));
        }
      } catch { /* ignore */ }
    };
    es.onerror = () => es.close();

    return () => { es.close(); };
  }, [conversationId, fetchMessages, otherUser.id]);

  // Mark incoming messages as read
  useEffect(() => {
    const unreadFromOther = messages.filter(m => m.senderId !== currentUserId && !m.readAt);
    if (unreadFromOther.length > 0) {
      const messageIds = unreadFromOther.map(m => m.id);
      fetch(`/api/dm/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds })
      }).catch(() => {});
      
      setMessages(prev => prev.map(m => 
        messageIds.includes(m.id) ? { ...m, readAt: new Date().toISOString() } : m
      ));
    }
  }, [messages, conversationId, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 10 ? 'smooth' : 'auto' });
  }, [messages, isOtherUserTyping]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

  const handleTyping = (val: string) => {
    setText(val);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Notify typing
    fetch(`/api/dm/${conversationId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping: true })
    }).catch(() => {});

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/dm/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: false })
      }).catch(() => {});
    }, 2000);
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const msgContent = text.trim();
    setText('');
    setSending(true);

    // Optimistic update
    const tempId = `tmp-${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      content: msgContent,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/dm/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgContent }),
      });
      const data = await res.json() as { message: MessageItem };
      setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(msgContent); // restore
    } finally {
      setSending(false);
    }
  };

  // Group messages by date, then by sender runs
  type MessageGroup = { date: string; runs: { senderId: string; msgs: MessageItem[] }[] };
  const grouped = messages.reduce<MessageGroup[]>((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    let dayGroup = acc.find(g => g.date === date);
    if (!dayGroup) { dayGroup = { date, runs: [] }; acc.push(dayGroup); }

    const lastRun = dayGroup.runs[dayGroup.runs.length - 1];
    if (lastRun && lastRun.senderId === msg.senderId) {
      lastRun.msgs.push(msg);
    } else {
      dayGroup.runs.push({ senderId: msg.senderId, msgs: [msg] });
    }
    return acc;
  }, []);

  const isOwn = (senderId: string) => senderId === currentUserId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.3rem', display: 'flex', borderRadius: '50%', transition: 'background 0.15s' }}
          className="back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar user={otherUser} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {otherUser?.displayName || otherUser?.email?.split('@')[0] || 'User'}
          </div>
          {otherUser?.username && (
            <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>@{otherUser.username}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', transition: 'all 0.15s' }} className="header-action">
            <Phone size={17} />
          </button>
          <button style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', transition: 'all 0.15s' }} className="header-action">
            <Video size={17} />
          </button>
          <button style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', transition: 'all 0.15s' }} className="header-action">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 0 }}>
        {grouped.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: '0.75rem', paddingTop: '4rem' }}>
            <Avatar user={otherUser} size={64} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', margin: 0 }}>
              {otherUser?.displayName || otherUser?.email?.split('@')[0]}
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Say hello 👋</p>
          </div>
        )}

        {grouped.map(dayGroup => (
          <div key={dayGroup.date} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Date separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dayGroup.date}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Message runs */}
            {dayGroup.runs.map((run, ri) => {
              const mine = isOwn(run.senderId);
              return (
                <div key={ri} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  {run.msgs.map((msg, mi) => {
                    const isLast = mi === run.msgs.length - 1;
                    const isFirst = mi === 0;
                    const isTemp = msg.id.startsWith('tmp-');
                    const isMe = isOwn(msg.senderId);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: isTemp ? 0.65 : 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '0.5rem',
                          flexDirection: mine ? 'row-reverse' : 'row',
                          maxWidth: '72%',
                        }}
                      >
                        {/* Avatar — only on last message of a run, and only for theirs */}
                        {!mine && (
                          <div style={{ width: 28, flexShrink: 0 }}>
                            {isLast && <Avatar user={otherUser} size={28} />}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            padding: '0.6rem 0.95rem',
                            borderRadius: mine
                              ? (isFirst && !isLast ? '18px 18px 4px 18px' : isLast && !isFirst ? '18px 4px 18px 18px' : isFirst && isLast ? '18px 18px 4px 18px' : '18px 4px 4px 18px')
                              : (isFirst && !isLast ? '18px 18px 18px 4px' : isLast && !isFirst ? '4px 18px 18px 18px' : isFirst && isLast ? '18px 18px 18px 4px' : '4px 18px 18px 4px'),
                            background: mine
                              ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
                              : 'rgba(30,41,59,0.9)',
                            color: 'white',
                            fontSize: '0.92rem',
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                            border: mine ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: mine ? '0 2px 12px rgba(59,130,246,0.25)' : 'none',
                          }}>
                            {msg.content}
                            <div style={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginTop: '0.4rem', textAlign: isMe ? 'right' : 'left', display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.2rem' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && (
                                <span>
                                  {msg.readAt ? <CheckCheck size={14} color="#60a5fa" /> : <Check size={14} />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
        
        {isOtherUserTyping && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
            <Avatar user={otherUser} size={32} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)' }} />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)' }} />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)' }} />
            </motion.div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '0.85rem 1rem',
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Start a new message…"
            style={{
              width: '100%',
              padding: '0.7rem 1.1rem',
              background: 'rgba(30,41,59,0.6)',
              border: '1px solid var(--card-border)',
              borderRadius: '9999px',
              color: 'white',
              fontSize: '0.92rem',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
        <motion.button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: 'none',
            cursor: text.trim() ? 'pointer' : 'default',
            background: text.trim()
              ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
              : 'rgba(255,255,255,0.08)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            boxShadow: text.trim() ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
          }}
        >
          <Send size={17} style={{ transform: 'translateX(1px)' }} />
        </motion.button>
      </div>
    </div>
  );
}

// ─── New DM Modal ─────────────────────────────────────────────────────────────
function NewDMModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (conversationId: string) => void;
}) {
  const [searchQ, setSearchQ] = useState('');
  const [users, setUsers] = useState<DMUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchQ.trim()) { setUsers([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}`);
        const data = await res.json() as { users: DMUser[] };
        setUsers(data.users || []);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [searchQ]);

  const startDM = async (userId: string) => {
    setStarting(userId);
    setError('');
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json() as { conversationId?: string; error?: string };
      if (!res.ok) { setError(data.error || 'Failed to start conversation'); return; }
      onStart(data.conversationId!);
    } catch { setError('Failed to start conversation'); } finally {
      setStarting(null);
    }
  };

  return (
    <motion.div
      className="modal-sheet"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        className="modal-panel"
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(13,20,37,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '22px',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>New Message</h3>
        </div>

        {/* Search input */}
        <div style={{ padding: '1rem 1.5rem 0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name or username…"
              autoFocus
              style={{
                width: '100%',
                padding: '0.7rem 1rem 0.7rem 2.5rem',
                background: 'rgba(30,41,59,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '9999px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '0.6rem', textAlign: 'center', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Searching…
            </div>
          ) : !searchQ.trim() ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              <Search size={32} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.88rem' }}>Type a name to find people</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No one found for &ldquo;{searchQ}&rdquo;</p>
            </div>
          ) : (
            users.map(u => (
              <button
                key={u.id}
                onClick={() => startDM(u.id)}
                disabled={starting === u.id}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: starting === u.id ? 'default' : 'pointer',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                  opacity: starting === u.id ? 0.7 : 1,
                }}
                className="conv-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Avatar user={u} size={42} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {u.displayName || u.email?.split('@')[0]}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                      {u.username ? `@${u.username}` : u.email}
                      {u.dmPrivacy === 'FOLLOWERS' && !u.isFollowing && (
                        <span style={{ color: '#f59e0b', fontSize: '0.72rem', background: 'rgba(245,158,11,0.1)', borderRadius: '4px', padding: '0.05rem 0.35rem', border: '1px solid rgba(245,158,11,0.25)' }}>
                          Followers only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: '9999px',
                  background: starting === u.id ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {starting === u.id ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div style={{ width: 12, height: 12, border: '2px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                      Opening…
                    </span>
                  ) : 'Message'}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>Press Esc to close</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', padding: '0.25rem 0.5rem', borderRadius: '6px', transition: 'background 0.15s' }} className="conv-item">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Empty State (no conversation selected on wide screen) ───────────────────
function EmptyState({ onNewDM }: { onNewDM: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--muted)', padding: '2rem' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <MessageSquare size={36} style={{ color: 'rgba(59,130,246,0.5)' }} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: '0.4rem' }}>Your messages</p>
        <p style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>Send private messages to the people you follow</p>
        <button onClick={onNewDM} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={16} /> New Message
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showNewDM, setShowNewDM] = useState(false);
  const [loading, setLoading] = useState(true);

  const { resetUnreadMessages } = useRealTime();

  useEffect(() => {
    resetUnreadMessages();
  }, [resetUnreadMessages, selectedId]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/dm');
      const d = await res.json() as { conversations?: ConversationItem[] };
      setConversations(d.conversations || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Get current user ID
    fetch('/api/user/profile')
      .then(r => r.json())
      .then((d: { user?: { id: string } }) => { if (d.user) setCurrentUserId(d.user.id); })
      .catch(() => {});

    refreshConversations().finally(() => setLoading(false));
  }, [refreshConversations]);

  const selectedConv = conversations.find(c => c.id === selectedId);

  const handleNewDMStart = async (conversationId: string) => {
    setShowNewDM(false);
    await refreshConversations();
    setSelectedId(conversationId);
  };

  // Keyboard shortcut: Esc to close modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNewDM(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="x-messages-layout">

      {/* ── Left: Conversation list ─────────────────────────── */}
      <div className={`x-messages-list ${selectedId ? 'has-selection' : ''}`}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading…
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNewDM={() => setShowNewDM(true)}
          />
        )}
      </div>

      {/* ── Right: Chat area ────────────────────────────────── */}
      <div className={`x-messages-chat ${!selectedId ? 'no-selection' : ''}`}>
        {selectedId && selectedConv ? (
          <ChatWindow
            key={selectedId}
            conversationId={selectedId}
            otherUser={selectedConv.otherUser}
            currentUserId={currentUserId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <EmptyState onNewDM={() => setShowNewDM(true)} />
        )}
      </div>

      {/* ── New DM Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showNewDM && (
          <NewDMModal
            onClose={() => setShowNewDM(false)}
            onStart={handleNewDMStart}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        .conv-item:hover { background: rgba(255,255,255,0.04) !important; }
        .back-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .header-action:hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
