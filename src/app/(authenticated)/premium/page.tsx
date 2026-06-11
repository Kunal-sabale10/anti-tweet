'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, Zap, Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PremiumPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button 
        onClick={() => router.back()} 
        style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Upgrade to Premium</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Get verified, boost your reach, and unlock exclusive features with an X Premium subscription.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Basic Tier (Current) */}
        <div style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Free</h2>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>$0<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)' }}><CheckCircle2 size={18} /> Standard reach</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)' }}><CheckCircle2 size={18} /> Basic media uploads</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)' }}><CheckCircle2 size={18} /> Standard character limit</li>
          </ul>

          <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.5 }} disabled>
            Current Plan
          </button>
        </div>

        {/* Premium Blue */}
        <div style={{ padding: '2rem', borderRadius: '16px', border: '2px solid var(--accent)', background: 'rgba(59, 130, 246, 0.05)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', padding: '0.2rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
            MOST POPULAR
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Premium <span style={{ color: 'var(--accent)' }}><CheckCircle2 size={24} fill="currentColor" stroke="white" /></span>
          </h2>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>$8<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--accent)" /> Blue checkmark</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={18} color="var(--accent)" /> Algorithmic boost in For You</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={18} color="var(--accent)" /> Write Community Notes</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} color="var(--accent)" /> Edit tweets</li>
          </ul>

          <Link href="/checkout?plan=BLUE" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Subscribe to Premium
            </button>
          </Link>
        </div>

        {/* Verified Org (Gold) */}
        <div style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #eab308', background: 'rgba(234, 179, 8, 0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Verified Orgs <span style={{ color: '#eab308' }}><svg width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor"/><path d="M7 12l3 3 7-7" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </h2>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>$1,000<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/mo</span></div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} color="#eab308" /> Gold checkmark & square avatar</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={18} color="#eab308" /> Massive algorithmic boost</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} color="#eab308" /> Premium support</li>
          </ul>

          <Link href="/checkout?plan=GOLD" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', background: '#eab308', color: 'black' }}>
              Subscribe as Organization
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
