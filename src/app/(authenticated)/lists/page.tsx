"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserList {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  memberCount: number;
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      const data = await res.json() as { lists: UserList[] };
      setLists(data.lists || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, isPrivate }),
      });
      if (res.ok) {
        setModalOpen(false);
        setName(''); setDesc(''); setIsPrivate(false);
        fetchLists();
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', zIndex: 10,
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Your Lists</h2>
        <button
          onClick={() => setModalOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.4rem', display: 'flex', borderRadius: '50%' }}
          className="icon-btn"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        {loading ? (
          <div className="cards-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <List size={48} style={{ opacity: 0.15, display: 'block', margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--foreground)', margin: '0 0 0.5rem' }}>No lists yet</h3>
            <p style={{ fontSize: '0.95rem', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Create curated lists to follow specific topics or groups of people.
            </p>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}>
              Create List
            </button>
          </div>
        ) : (
          <div className="cards-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {lists.map(list => (
              <Link key={list.id} href={`/lists/${list.id}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px',
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'border-color 0.2s',
                  }}
                  className="list-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--foreground)', fontSize: '1.1rem' }}>{list.name}</h3>
                    {list.isPrivate && <Lock size={14} color="var(--muted)" />}
                  </div>
                  {list.description && (
                    <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {list.description}
                    </p>
                  )}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', fontSize: '0.75rem', fontWeight: 700 }}>
                      {list.memberCount}
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Members</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-sheet"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
              backdropFilter: 'blur(4px)',
            }}
            onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              className="modal-panel"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
            >
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '50%' }} className="icon-btn">
                    <X size={20} />
                  </button>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Create a new List</h3>
                </div>
                <button onClick={handleCreate} disabled={!name.trim() || saving} className="btn" style={{ padding: '0.45rem 1.25rem', fontWeight: 700, background: 'white', color: '#0f172a', opacity: (!name.trim() || saving) ? 0.5 : 1 }}>
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>

              <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem 1rem', position: 'relative' }}>
                  <label style={{ position: 'absolute', top: -10, left: 12, background: 'var(--card-bg)', padding: '0 4px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={25} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', fontSize: '1rem', fontFamily: 'inherit' }} placeholder="e.g. Tech News" />
                  <span style={{ position: 'absolute', bottom: 6, right: 10, color: 'var(--muted)', fontSize: '0.72rem' }}>{name.length}/25</span>
                </div>
                
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem 1rem', position: 'relative' }}>
                  <label style={{ position: 'absolute', top: -10, left: 12, background: 'var(--card-bg)', padding: '0 4px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Description</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={100} rows={2} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', fontSize: '1rem', fontFamily: 'inherit', resize: 'none' }} placeholder="What is this list about?" />
                  <span style={{ position: 'absolute', bottom: 6, right: 10, color: 'var(--muted)', fontSize: '0.72rem' }}>{desc.length}/100</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" id="private-list" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                  <div>
                    <label htmlFor="private-list" style={{ fontWeight: 600, display: 'block' }}>Make private</label>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Only you can see this list.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .icon-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .list-card:hover { border-color: rgba(255,255,255,0.2) !important; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
      `}</style>
    </div>
  );
}
