"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getErrorMessage } from '@/lib/errors';
import Logo from '@/components/Logo';
import type { ApiErrorResponse, LoginOtpResponse, LoginSessionData } from '@/lib/types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [sessionData, setSessionData] = useState<LoginSessionData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = (await res.json()) as ApiErrorResponse & LoginOtpResponse;
      
      if (!res.ok) throw new Error(data.error);

      if (data.requiresOtp) {
        setRequiresOtp(true);
        setUserId(data.userId || '');
        setSessionData(data.sessionData || null);
      } else if (data.success) {
        window.location.href = data.redirect || '/';
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: otp, sessionData })
      });
      const data = (await res.json()) as ApiErrorResponse & LoginOtpResponse;
      
      if (!res.ok) throw new Error(data.error);

      if (data.success) {
        window.location.href = data.redirect || '/';
      }
    } catch (error) {
      setError(getErrorMessage(error, 'OTP verification failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel" 
        style={{ padding: '2.5rem', width: '100%', maxWidth: '420px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #60a5fa, #3b82f6, #60a5fa)', backgroundSize: '200% auto', animation: 'gradient-flow 3s linear infinite' }} />
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Logo size={56} />
          <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>Anti-Tweet</div>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem' }}>Experience social media, redefined.</p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!requiresOtp ? (
            <motion.div 
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <a href="/api/auth/oauth?provider=google" className="btn" style={{ flex: 1, background: '#fff', color: '#000', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </a>
                <a href="/api/auth/oauth?provider=github" className="btn" style={{ flex: 1, background: '#333', color: '#fff', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  GitHub
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ padding: '0 10px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="name@example.com" required />
                </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Reset Password</Link>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>
              
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Authenticating...
                  </span>
                ) : 'Secure Login'}
              </button>
              </form>
            </motion.div>
          ) : (
            <motion.form 
              key="otp-form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleVerifyOtp} 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Verify Identity</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  We&apos;ve sent a 6-digit code to your email. This account is protected by multi-factor authentication.
                </p>
              </div>
              <div>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  className="input-field" 
                  placeholder="000 000" 
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 700 }}
                  required 
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                {loading ? 'Verifying...' : 'Authorize Session'}
              </button>
              <button type="button" onClick={() => setRequiresOtp(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel and try again
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
            Session Security Active
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
            Your login is being monitored for security. Mobile access is restricted to 10 AM - 1 PM IST. 
            {requiresOtp ? " Advanced verification triggered due to browser profile." : " Chrome users require OTP."}
          </p>
        </div>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--muted)' }}>New to Anti-Tweet? </span>
          <Link href="/register" style={{ fontWeight: 600, color: '#60a5fa' }}>Create an account</Link>
        </div>
      </motion.div>
      
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
