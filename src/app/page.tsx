import Link from 'next/link';

export default function Home() {
  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
      <div style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          Share Your Voice, <br />
          <span style={{ color: 'var(--accent)' }}>Without the Noise.</span>
        </h2>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          Anti-Tweet is the premium social platform offering fine-grained controls, rich audio tweets, and exclusive subscription tiers to protect your experience.
        </p>

        <div className="home-cta-row" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <span className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Get Started</span>
          </Link>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <span className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>View Plans</span>
          </Link>
        </div>


        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-around', gap: '2rem', textAlign: 'left', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#60a5fa' }}>🎙️ Audio Tweets</h3>
            <p style={{ color: 'var(--muted)' }}>Share your express voice with up to 5 minutes of high-quality audio.</p>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#34d399' }}>🔔 Smart Alerts</h3>
            <p style={{ color: 'var(--muted)' }}>Get notified for topics that matter to you. Silence the rest.</p>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#f472b6' }}>🛡️ Ironclad Security</h3>
            <p style={{ color: 'var(--muted)' }}>OTP verifications and detailed session tracking to keep your account safe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
