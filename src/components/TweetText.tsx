import React from 'react';
import Link from 'next/link';

export default function TweetText({ content }: { content: string }) {
  if (!content) return null;

  // Regex to match hashtags and mentions, and URLs
  const regex = /(#[\w]+|@[\w]+|https?:\/\/[^\s]+)/g;
  const parts = content.split(regex);

  return (
    <p style={{ fontSize: '1rem', lineHeight: '1.5', color: '#e2e8f0', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return (
            <Link key={i} href={`/explore?q=${encodeURIComponent(part)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} className="hover-underline">
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          return (
            <Link key={i} href={`/profile/${part.substring(1)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} className="hover-underline">
              {part}
            </Link>
          );
        }
        if (part.startsWith('http')) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }} className="hover-underline">
              {part}
            </a>
          );
        }
        return part;
      })}
      <style>{`
        .hover-underline:hover { text-decoration: underline !important; }
      `}</style>
    </p>
  );
}
