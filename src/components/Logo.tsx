// Anti-Tweet Logo — geometric AT lettermark, ChatGPT-inspired style
// Bold geometric strokes + hexagonal ring + gradient, matches dark navy theme
export default function Logo({ size = 40 }: { size?: number }) {
  const id = `at-grad-${size}`; // unique gradient id per size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Anti-Tweet"
    >
      <defs>
        {/* Main blue → indigo gradient flowing diagonally */}
        <linearGradient id={`${id}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#93c5fd" />
          <stop offset="50%"  stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        {/* Crossbar / accent: cyan → blue */}
        <linearGradient id={`${id}-b`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        {/* Subtle glow filter */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background: dark card with rounded corners ── */}
      <rect width="100" height="100" rx="22" fill="#0f172a" />

      {/* ── Outer hexagonal ring (ChatGPT-style geometric backdrop) ── */}
      <polygon
        points="50,6 88,27 88,73 50,94 12,73 12,27"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />

      {/* ── Inner rotated hexagon (creates depth/perspective feel) ── */}
      <polygon
        points="50,14 82,32 82,68 50,86 18,68 18,32"
        fill="none"
        stroke="#6366f1"
        strokeWidth="1"
        strokeOpacity="0.15"
        transform="rotate(30 50 50)"
      />

      {/* ── Subtle radial spokes (connects hex vertices to center) ── */}
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        const x2 = (50 + 42 * Math.sin(rad)).toFixed(4);
        const y2 = (50 - 42 * Math.cos(rad)).toFixed(4);
        return (
          <line
            key={deg}
            x1="50" y1="50"
            x2={x2} y2={y2}
            stroke="#3b82f6"
            strokeWidth="0.6"
            strokeOpacity="0.10"
          />
        );
      })}

      {/* ══════════════════════════════════════
          AT LETTERFORM — geometric construction
          
          A: apex (29,16) | bottom-left (10,82) | bottom-right (48,82)
             crossbar at y=55 from x≈18 to x≈39
          
          T: top-bar (46,16)→(90,16) | stem x=68 from y=16→82
          
          A's right leg + T's left bar share the visual weight
          ══════════════════════════════════════ */}

      {/* — A: left diagonal leg — */}
      <line
        x1="10" y1="82"
        x2="29" y2="16"
        stroke={`url(#${id}-a)`}
        strokeWidth="9.5"
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
      />

      {/* — A: right diagonal leg — */}
      <line
        x1="29" y1="16"
        x2="48" y2="82"
        stroke={`url(#${id}-a)`}
        strokeWidth="9.5"
        strokeLinecap="round"
      />

      {/* — A: crossbar (also visually connects to T's top zone) — */}
      <line
        x1="18" y1="55"
        x2="40" y2="55"
        stroke={`url(#${id}-b)`}
        strokeWidth="8.5"
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
      />

      {/* — T: horizontal top bar — */}
      <line
        x1="50" y1="16"
        x2="90" y2="16"
        stroke={`url(#${id}-a)`}
        strokeWidth="9.5"
        strokeLinecap="round"
      />

      {/* — T: vertical stem — */}
      <line
        x1="70" y1="16"
        x2="70" y2="82"
        stroke={`url(#${id}-a)`}
        strokeWidth="9.5"
        strokeLinecap="round"
      />

      {/* ── Geometric accent dots at key junctions ── */}
      {/* A apex */}
      <circle cx="29" cy="16" r="5" fill="#93c5fd" fillOpacity="0.9" />
      {/* T top-left corner */}
      <circle cx="50" cy="16" r="4" fill="#6366f1" fillOpacity="0.85" />
      {/* T top-right corner */}
      <circle cx="90" cy="16" r="4" fill="#6366f1" fillOpacity="0.7" />
      {/* Center hex dot */}
      <circle cx="50" cy="50" r="2.5" fill="#38bdf8" fillOpacity="0.5" />
    </svg>
  );
}
