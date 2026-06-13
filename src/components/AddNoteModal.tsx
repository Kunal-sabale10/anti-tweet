'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetId: string;
}

export default function AddNoteModal({ isOpen, onClose, tweetId }: AddNoteModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/tweets/${tweetId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Note submitted! It will appear once enough users vote it as helpful.');
        onClose();
        setContent('');
      } else {
        alert(data.error || 'Failed to submit note');
      }
    } catch (e) {
      alert('Error submitting note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-sheet" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel modal-panel"
        style={{ width: '100%', maxWidth: '500px', position: 'relative', padding: '1.5rem' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert /> Write a Community Note
        </h2>

        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Help keep Anti-Tweet informative by adding missing context. Your note will be publicly visible if enough contributors find it helpful.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea 
            className="input-field" 
            placeholder="Provide context or missing information..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', minHeight: '120px', marginBottom: '1.5rem', resize: 'vertical' }}
            required
          />

          <div className="modal-action-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || content.trim().length < 10}>
              {loading ? 'Submitting...' : 'Submit Note'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
