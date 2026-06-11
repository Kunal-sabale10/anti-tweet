'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  helpfulCount: number;
  notHelpfulCount: number;
  author: { displayName: string | null; username: string | null };
}

export default function CommunityNoteWidget({ tweetId }: { tweetId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tweets/${tweetId}/notes`)
      .then(res => res.json())
      .then(data => {
        if (data.notes && data.notes.length > 0) {
          // Display the highest ranked approved note
          setNote(data.notes[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tweetId]);

  const handleVote = async (isHelpful: boolean) => {
    if (!note || voted) return;
    try {
      const res = await fetch(`/api/tweets/${tweetId}/notes/${note.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful })
      });
      if (res.ok) {
        setVoted(true);
        alert('Thank you for voting!');
      } else {
        const data = await res.json();
        alert(data.error || 'Vote failed');
      }
    } catch (e) {
      alert('Error casting vote');
    }
  };

  if (loading || !note) return null;

  return (
    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--foreground)', fontWeight: 800 }}>
        <ShieldAlert size={16} /> Readers added context they thought people might want to know
      </div>
      <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', lineHeight: '1.5' }}>
        {note.content}
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
          Do you find this helpful?
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => handleVote(true)} 
            disabled={voted}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid var(--card-border)', padding: '0.25rem 0.75rem', borderRadius: '99px', color: 'var(--muted)', cursor: voted ? 'default' : 'pointer', opacity: voted ? 0.5 : 1 }}
          >
            <ThumbsUp size={14} /> Yes
          </button>
          <button 
            onClick={() => handleVote(false)} 
            disabled={voted}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid var(--card-border)', padding: '0.25rem 0.75rem', borderRadius: '99px', color: 'var(--muted)', cursor: voted ? 'default' : 'pointer', opacity: voted ? 0.5 : 1 }}
          >
            <ThumbsDown size={14} /> No
          </button>
        </div>
      </div>
    </div>
  );
}
