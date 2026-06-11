import React from 'react';
import { Play } from 'lucide-react';

interface MediaItem {
  url: string;
  type: string;
  order: number;
}

interface TweetMediaProps {
  tweet: {
    imageUrl?: string | null;
    audioUrl?: string | null;
    media?: MediaItem[];
    linkPreviewUrl?: string | null;
    linkPreviewTitle?: string | null;
    linkPreviewImg?: string | null;
    linkPreviewDesc?: string | null;
  };
}

export default function TweetMedia({ tweet }: TweetMediaProps) {
  const hasLegacyImage = tweet.imageUrl && (!tweet.media || tweet.media.length === 0);
  const mediaList = tweet.media?.length ? tweet.media.sort((a, b) => a.order - b.order) : [];

  const renderGrid = (items: MediaItem[]) => {
    if (items.length === 1) {
      const item = items[0];
      if (item.type === 'VIDEO') {
        return (
          <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <video src={item.url} controls style={{ width: '100%', display: 'block' }} />
          </div>
        );
      }
      return (
        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
          <img src={item.url} alt="" style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'cover' }} />
        </div>
      );
    }

    if (items.length === 2) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', aspectRatio: '16/9' }}>
          {items.map((item, i) => (
            <img key={i} src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ))}
        </div>
      );
    }

    if (items.length === 3) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', aspectRatio: '16/9' }}>
          <div style={{ gridRow: '1 / span 2' }}>
            <img src={items[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <img src={items[1].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <img src={items[2].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      );
    }

    if (items.length >= 4) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', aspectRatio: '16/9' }}>
          {items.slice(0, 4).map((item, i) => (
            <img key={i} src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ marginBottom: '0.75rem', width: '100%' }}>
      {/* Legacy single image */}
      {hasLegacyImage && (
        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
          <img src={tweet.imageUrl!} alt="" style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'cover' }} />
        </div>
      )}

      {/* Modern Multi-Media Grid */}
      {mediaList.length > 0 && renderGrid(mediaList)}

      {/* Audio support */}
      {tweet.audioUrl && (
        <audio src={tweet.audioUrl} controls style={{ width: '100%', height: '36px', borderRadius: '9999px', marginTop: '0.5rem' }} />
      )}

      {/* Link Preview (Only show if no media exists) */}
      {!hasLegacyImage && mediaList.length === 0 && tweet.linkPreviewUrl && (
        <a href={tweet.linkPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }} className="tweet-hover">
            {tweet.linkPreviewImg && (
              <img src={tweet.linkPreviewImg} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid var(--card-border)' }} />
            )}
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {new URL(tweet.linkPreviewUrl).hostname}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {tweet.linkPreviewTitle || tweet.linkPreviewUrl}
              </div>
              {tweet.linkPreviewDesc && (
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {tweet.linkPreviewDesc}
                </div>
              )}
            </div>
          </div>
        </a>
      )}
    </div>
  );
}
