'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Globe, Lock, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Community {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetch('/api/communities')
      .then(r => r.json())
      .then(d => { setCommunities(d.communities || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (id: string) => {
    const res = await fetch(`/api/communities/${id}/join`, { method: 'POST' });
    const data = await res.json();
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, isMember: data.joined, memberCount: c.memberCount + (data.joined ? 1 : -1) } : c));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.community) {
      setCommunities(prev => [{ ...data.community, memberCount: 1, isMember: true }, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '' });
    }
    setCreating(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} /> Communities
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Community Grid */}
      <div style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>Loading communities...</div>
        ) : communities.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Users size={56} color="var(--muted)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>No communities yet</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Be the first! Create a community around any topic.</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">Create Community</button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {communities.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel"
                style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                {/* Accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `hsl(${(i * 47) % 360}, 70%, 55%)` }} />

                <Link href={`/communities/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `linear-gradient(135deg, hsl(${(i * 47) % 360}, 70%, 40%), hsl(${(i * 47 + 60) % 360}, 70%, 55%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Hash size={20} color="white" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.memberCount} member{c.memberCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {c.description && (
                    <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </p>
                  )}
                </Link>

                <button
                  onClick={() => handleJoin(c.id)}
                  style={{
                    width: '100%', padding: '0.5rem', borderRadius: '99px', border: 'none', cursor: 'pointer',
                    background: c.isMember ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg, var(--accent), #60a5fa)',
                    color: c.isMember ? 'var(--accent)' : 'white',
                    fontWeight: 700, fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {c.isMember ? 'Joined ✓' : 'Join'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: 480, position: 'relative', padding: '1.5rem' }}
            >
              <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Create a Community</h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Community Name *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Next.js Developers"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Description</label>
                  <textarea
                    className="input-field"
                    placeholder="What is this community about?"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary" disabled={creating}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating || !form.name.trim()}>
                    {creating ? 'Creating...' : 'Create Community'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
