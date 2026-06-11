"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';

const mockRealGifs = [
  "https://media.giphy.com/media/l0Exk8EUzSLsrErEQ/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/xT0xeJpnrWC4XWblOo/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
  "https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif",
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/yYSSBtDgbbRzq/giphy.gif",
  "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
  "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif",
  "https://media.giphy.com/media/CjmvTCZf2U3p09Cn0h/giphy.gif",
  "https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif",
  "https://media.giphy.com/media/l2JhtKtDWYNKdRpoA/giphy.gif",
  "https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif",
  "https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/TdfyKrN7HGTIY/giphy.gif",
  "https://media.giphy.com/media/l3q2K5jqMza5bH0sE/giphy.gif",
  "https://media.giphy.com/media/26FPCXdkvDbKBbgOI/giphy.gif",
  "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
];

export default function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGifs = searchTerm
    ? mockRealGifs.filter(() => Math.random() > 0.3) // mock filtering
    : mockRealGifs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', maxHeight: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', flexShrink: 0 }}>
        <Search size={16} style={{ color: 'var(--muted)', marginRight: '0.5rem' }} />
        <input
          autoFocus
          type="text"
          placeholder="Search for GIFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--foreground)',
            width: '100%',
            fontSize: '0.9rem',
          }}
        />
      </div>
      
      <div style={{ 
        overflowY: 'auto', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.5rem',
        paddingRight: '0.25rem',
      }}>
        {filteredGifs.map((gif, i) => (
          <img
            key={i}
            src={gif}
            alt="GIF"
            style={{
              width: '100%',
              borderRadius: '6px',
              cursor: 'pointer',
              border: '2px solid transparent',
              aspectRatio: '1',
              objectFit: 'cover'
            }}
            onClick={() => onSelect(gif)}
          />
        ))}
      </div>
    </div>
  );
}
