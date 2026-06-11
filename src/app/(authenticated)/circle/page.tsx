"use client";

import { useState } from 'react';
import { Users, Search, Plus, X, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

export default function CirclePage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for UI demonstration since backend is skipped
  const [circleMembers, setCircleMembers] = useState([
    { id: '1', username: 'kunal', displayName: 'Kunal', avatarUrl: null },
    { id: '2', username: 'alex', displayName: 'Alex Dev', avatarUrl: null },
  ]);

  const [searchResults, setSearchResults] = useState([
    { id: '3', username: 'johndoe', displayName: 'John Doe', avatarUrl: null },
    { id: '4', username: 'janedoe', displayName: 'Jane Doe', avatarUrl: null },
  ]);

  const handleRemove = (id: string) => {
    setCircleMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleAdd = (user: any) => {
    if (!circleMembers.find(m => m.id === user.id)) {
      setCircleMembers(prev => [...prev, user]);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={28} color="#10b981" /> Twitter Circle
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
          Choose who can see your Circle Tweets. Anyone added to your Circle will be able to see Tweets you share to it.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <Search size={20} color="var(--muted)" />
          <input 
            type="text" 
            placeholder="Search for people to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', width: '100%', outline: 'none' }}
          />
        </div>

        {searchQuery.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Search Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResults.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {user.displayName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.displayName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>@{user.username}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAdd(user)}
                    disabled={circleMembers.some(m => m.id === user.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    {circleMembers.some(m => m.id === user.id) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Your Circle</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
            {circleMembers.length} / 150
          </span>
        </div>

        {circleMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
            <ShieldAlert size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p>Your Circle is empty.</p>
            <p style={{ fontSize: '0.85rem' }}>Search for people above to add them.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {circleMembers.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {member.displayName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{member.displayName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>@{member.username}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(member.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                  title="Remove from Circle"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
