import React from 'react';
import TweetCard from '@/components/TweetCard';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export default async function EmbedTweetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Need to use absolute URL for fetch in Server Component
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/tweets/${id}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return notFound();
    }
    
    const data = await res.json();
    const tweet = data.tweet;

    if (!tweet) {
      return notFound();
    }

    return (
      <div style={{
        background: 'transparent',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--card-bg, #0f172a)',
          borderRadius: '12px',
          border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <TweetCard 
            tweet={tweet} 
            // In embed mode we disable interactive actions by providing no-op functions
            onLike={() => {}} 
            onRetweet={() => {}} 
            onBookmark={() => {}} 
          />
        </div>
      </div>
    );
  } catch (error) {
    return notFound();
  }
}
