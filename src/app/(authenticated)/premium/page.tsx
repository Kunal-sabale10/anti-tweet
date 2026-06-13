'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, Zap, Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PremiumPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button 
        onClick={() => router.back()} 
        style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Upgrade to Premium</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Get verified, boost your reach, and unlock exclusive features with a subscription.
        </p>
      </div>

      <div className="premium-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        {/* Free Tier */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Free</h2>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>₹0<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)' }}><CheckCircle2 size={16} /> 1 Tweet limit</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)' }}><CheckCircle2 size={16} /> Standard reach</li>
          </ul>

          <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.5, padding: '0.75rem' }} disabled>
            Current Plan
          </button>
        </div>

        {/* Bronze Tier */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #b08d57', background: 'rgba(176, 141, 87, 0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Bronze <span style={{ color: '#b08d57' }}><CheckCircle2 size={18} fill="currentColor" stroke="white" /></span>
          </h2>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>₹100<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#b08d57" /> Up to 3 Tweets limit</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16} color="#b08d57" /> Bronze badge</li>
          </ul>

          <Link href="/checkout?plan=BRONZE" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', background: '#b08d57', color: 'white', border: 'none' }}>
              Subscribe
            </button>
          </Link>
        </div>

        {/* Silver Tier */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #94a3b8', background: 'rgba(148, 163, 184, 0.05)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#94a3b8', color: 'white', padding: '0.2rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
            POPULAR
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Silver <span style={{ color: '#94a3b8' }}><CheckCircle2 size={18} fill="currentColor" stroke="white" /></span>
          </h2>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>₹300<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#94a3b8" /> Up to 5 Tweets limit</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16} color="#94a3b8" /> Silver badge</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={16} color="#94a3b8" /> Premium features</li>
          </ul>

          <Link href="/checkout?plan=SILVER" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', background: '#94a3b8', color: 'white', border: 'none' }}>
              Subscribe
            </button>
          </Link>
        </div>

        {/* Gold Tier */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', border: '2px solid #eab308', background: 'rgba(234, 179, 8, 0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Gold <span style={{ color: '#eab308' }}><Star size={18} fill="currentColor" /></span>
          </h2>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>₹1000<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#eab308" /> Unlimited Tweets</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16} color="#eab308" /> Massive algorithmic boost</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={16} color="#eab308" /> Gold checkmark</li>
          </ul>

          <Link href="/checkout?plan=GOLD" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', background: '#eab308', color: 'black', border: 'none' }}>
              Subscribe
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
