"use client";

import { useState } from 'react';
import { Hash, Check, Plus } from 'lucide-react';

const HARDCODED_TOPICS = [
  { id: '1', name: 'Technology', description: 'All about the latest tech, gadgets, and software.', followers: '1.2M' },
  { id: '2', name: 'Sports', description: 'Football, basketball, tennis, and more.', followers: '850K' },
  { id: '3', name: 'Gaming', description: 'Video games, esports, and streaming.', followers: '2.1M' },
  { id: '4', name: 'Politics', description: 'Global political news and discussions.', followers: '3.4M' },
  { id: '5', name: 'Science', description: 'Space, physics, biology, and discoveries.', followers: '920K' },
  { id: '6', name: 'Art & Design', description: 'Digital art, graphic design, and creativity.', followers: '450K' },
];

export default function TopicsPage() {
  const [followedTopics, setFollowedTopics] = useState<string[]>(['1', '3']); // Default mock follows

  const toggleFollow = (id: string) => {
    setFollowedTopics(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Hash size={28} color="var(--accent)" /> Topics
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
          Follow topics to personalize your feed. Tweets about these topics will appear more frequently in your timeline.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {HARDCODED_TOPICS.map(topic => {
          const isFollowed = followedTopics.includes(topic.id);
          return (
            <div key={topic.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{topic.name}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', minHeight: '40px' }}>{topic.description}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                  {topic.followers} followers
                </div>
              </div>
              
              <button
                onClick={() => toggleFollow(topic.id)}
                className={isFollowed ? "btn btn-secondary" : "btn btn-primary"}
                style={{ 
                  marginTop: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  background: isFollowed ? 'transparent' : 'white',
                  color: isFollowed ? 'white' : 'black',
                  border: isFollowed ? '1px solid var(--card-border)' : 'none',
                }}
              >
                {isFollowed ? (
                  <>
                    <Check size={18} /> Following
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Follow
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
