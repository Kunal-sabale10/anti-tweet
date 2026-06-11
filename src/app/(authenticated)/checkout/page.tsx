'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!plan || (plan !== 'BLUE' && plan !== 'GOLD')) {
      router.push('/premium');
    }
  }, [plan, router]);

  if (!plan) return null;

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard?upgrade=success';
        }, 2000);
      } else {
        alert('Payment simulation failed');
      }
    } catch (e) {
      alert('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const isGold = plan === 'GOLD';
  const price = isGold ? '$1,000.00' : '$8.00';
  const title = isGold ? 'X Premium for Organizations' : 'X Premium';

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}
        >
          <div style={{ color: '#10b981', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
            Your account has been upgraded to <strong>{plan}</strong>.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#60a5fa' }}>Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '800px', display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: Order Summary */}
        <div style={{ flex: 1, padding: '2.5rem', background: '#f1f5f9', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: isGold ? '#eab308' : '#3b82f6' }}>
             <ShieldCheck size={28} />
             <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Stripe <span style={{ color: '#64748b', fontWeight: 400, fontSize: '1rem' }}>Test Mode</span></span>
          </div>

          <h2 style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Subscribe to</h2>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', color: '#0f172a' }}>{title}</h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '1.5rem 0', marginBottom: '2rem' }}>
             <span style={{ fontWeight: 600 }}>Total due today</span>
             <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{price}</span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', gap: '0.5rem', color: '#475569' }}><CheckCircle2 size={20} color={isGold ? '#eab308' : '#3b82f6'} /> Renews automatically every month.</li>
            <li style={{ display: 'flex', gap: '0.5rem', color: '#475569' }}><CheckCircle2 size={20} color={isGold ? '#eab308' : '#3b82f6'} /> Cancel anytime in settings.</li>
          </ul>
        </div>

        {/* Right Side: Mock Payment Form */}
        <div style={{ flex: 1, padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Payment Details <Lock size={16} color="#10b981" />
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Card Information</label>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc' }}>
              <CreditCard size={20} color="#94a3b8" />
              <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}>4242 4242 4242 4242</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Expiration</label>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.75rem', color: '#94a3b8', background: '#f8fafc' }}>
                12 / 34
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>CVC</label>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.75rem', color: '#94a3b8', background: '#f8fafc' }}>
                123
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', fontSize: '0.85rem', color: '#1e40af' }}>
            <strong>Note:</strong> This is a mock checkout. Click the button below to simulate a successful Stripe payment.
          </div>

          <button 
            onClick={handlePayment} 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? 'Processing...' : `Pay ${price}`}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}>
               Cancel
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
