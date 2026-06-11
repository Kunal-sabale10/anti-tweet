export default function VerifiedBadge({ subscription }: { subscription?: string | null }) {
  if (!subscription || subscription === 'FREE') return null;
  const isGold = subscription === 'GOLD';
  const color = isGold ? '#eab308' : subscription === 'SILVER' ? '#94a3b8' : '#3b82f6';
  
  return (
    <span title={`${subscription} subscriber`} style={{ display:'inline-flex', alignItems:'center', marginLeft:'4px', color, fontSize:'0.85em' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        {isGold ? (
          <rect x="0" y="0" width="16" height="16" rx="4" />
        ) : (
          <circle cx="8" cy="8" r="8" />
        )}
        <path d="M5 8l2 2 4-4" stroke={isGold ? "#000" : "white"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
