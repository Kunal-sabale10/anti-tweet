"use client";
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getErrorMessage } from '@/lib/errors';
import type { ApiErrorResponse, AuthSuccessResponse } from '@/lib/types';
import Logo from '@/components/Logo';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [subscription, setSubscription] = useState('FREE');
  const [language, setLanguage] = useState('EN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password, subscription, language })
      });
      const data = (await res.json()) as ApiErrorResponse & AuthSuccessResponse;
      
      if (!res.ok) throw new Error(data.error);

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard';
        }, 2000);
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (success) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel" 
          style={{ padding: '3rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Welcome to Anti-Tweet!</h2>
          <p style={{ color: 'var(--muted)' }}>Preparing your premium social dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-panel" 
        style={{ padding: '2.5rem', width: '100%', maxWidth: '500px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Logo size={52} />
          <div style={{ marginTop: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>Anti-Tweet</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ height: '4px', width: '30px', borderRadius: '2px', background: step >= 1 ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
          <div style={{ height: '4px', width: '30px', borderRadius: '2px', background: step >= 2 ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
          {step === 1 ? 'Basic Details' : 'Choose Your Plan'}
        </h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem' }}>
          {step === 1 ? 'Join the exclusive anti-tweet community.' : 'Select a membership that fits your needs.'}
        </p>
        
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+91 9999999999" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>System Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field" style={{ appearance: 'none' }}>
                  <option value="EN">English</option>
                  <option value="HI">Hindi</option>
                  <option value="ES">Spanish</option>
                  <option value="FR">French</option>
                </select>
              </div>
              
              <button type="button" onClick={() => setStep(2)} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                Next Step
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onSubmit={handleRegister}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {['FREE', 'BRONZE', 'SILVER', 'GOLD'].map((plan) => (
                  <label key={plan} style={{ 
                    cursor: 'pointer',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: subscription === plan ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    background: subscription === plan ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <input type="radio" value={plan} checked={subscription === plan} onChange={() => setSubscription(plan)} style={{ display: 'none' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{plan}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {plan === 'FREE' ? 'Standard Access' : plan === 'GOLD' ? 'All Features' : 'Advanced Experience'}
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                  {loading ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--muted)' }}>Already have an account? </span>
          <Link href="/login" style={{ fontWeight: 600 }}>Log in here</Link>
        </div>
      </motion.div>
    </div>
  );
}
