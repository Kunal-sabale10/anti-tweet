import Link from 'next/link';

export default function Pricing() {
  const plans = [
    { name: 'Free', price: '₹0', tweets: 1, limit: 'per account', color: '#64748b' },
    { name: 'Bronze', price: '₹100', tweets: 3, limit: 'per month', color: '#cd7f32' },
    { name: 'Silver', price: '₹300', tweets: 5, limit: 'per month', color: '#94a3b8', recommended: true },
    { name: 'Gold', price: '₹1000', tweets: 'Unlimited', limit: 'per month', color: '#fbbf24' }
  ];

  return (
    <div className="container animate-fade-in px-4 py-8 sm:px-6 lg:px-8" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 className="text-3xl sm:text-5xl" style={{ fontWeight: 800, marginBottom: '1rem' }}>Simple, Transparent Pricing</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
          Choose a plan that fits your voice. Keep the noise low and quality high.
        </p>
      </div>

      <div className="pricing-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.name} className="glass-panel pricing-card" style={{ width: '100%', padding: '2.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', borderColor: plan.recommended ? 'var(--accent)' : undefined }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: plan.color }}></div>
            {plan.recommended && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--accent)', color: 'white', borderRadius: '9999px', padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 800 }}>
                Recommended
              </div>
            )}
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: plan.color, marginBottom: '1rem' }}>{plan.name}</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.25rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{plan.price}</span>
              <span style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>/mo</span>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', textAlign: 'left' }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> {plan.tweets} Tweet{plan.tweets !== 1 && 's'} limit
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Audio Tweets allowed
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Strict security & Auth
              </li>
            </ul>
            
            <Link href={`/checkout?plan=${plan.name.toUpperCase()}`} style={{ width: '100%', textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ width: '100%', background: plan.name === 'Gold' ? 'linear-gradient(135deg, #fbbf24, #d97706)' : undefined }}>
                Choose {plan.name}
              </button>
            </Link>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', textAlign: 'center', maxWidth: '800px', margin: '4rem auto 0' }}>
        <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>⏰</span> Important Billing Notice
        </h4>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
          To ensure controlled transactions and a premium service window, all payment and subscription upgrades are restricted globally to between <strong>10:00 AM and 11:00 AM IST</strong>. Payments attempted outside this window will be temporarily paused.
        </p>
      </div>
    </div>
  );
}
