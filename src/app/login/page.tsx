"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';

// ─── Twitter/X Style Login Flow ───────────────────────────────────────────────
// Step 1: Enter email → checks if account exists in DB
// Step 2a: Account EXISTS → show password field → login
// Step 2b: Account DOES NOT EXIST → show "create account" prompt

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'password' | 'not-found'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Load previously used emails from localStorage for autocomplete
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('at_emails') || '[]') as string[];
      setEmailSuggestions(saved);
    } catch {
      setEmailSuggestions([]);
    }
  }, []);

  const filteredSuggestions = emailSuggestions.filter(e =>
    email.length > 0 && e.toLowerCase().includes(email.toLowerCase()) && e !== email
  );

  // Step 1: Check if email exists in DB
  const handleEmailNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json() as { exists: boolean; error?: string };

      if (!res.ok) throw new Error(data.error || 'Failed to check email');

      if (data.exists) {
        setStep('password');
      } else {
        setStep('not-found');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Login with password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json() as { success?: boolean; redirect?: string; error?: string };

      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      if (data.success) {
        // Save email to localStorage for future autocomplete
        try {
          const saved = JSON.parse(localStorage.getItem('at_emails') || '[]') as string[];
          if (!saved.includes(email.trim())) {
            localStorage.setItem('at_emails', JSON.stringify([email.trim(), ...saved].slice(0, 5)));
          }
        } catch { /* ignore */ }

        window.location.href = data.redirect || '/dashboard';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo size={48} />
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: EMAIL ─────────────────────── */}
          {step === 'email' && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.25 }}
            >
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                Sign in to Anti-Tweet
              </h1>
              <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Enter your email to continue
              </p>

              {/* Social Login */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <a href="/api/auth/oauth?provider=google" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s'
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </a>
                <a href="/api/auth/oauth?provider=github" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s'
                }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  Continue with GitHub
                </a>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailNext} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{
                    color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}

                {/* Email input with autocomplete */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                    Email address
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '0.85rem 1rem', borderRadius: '8px',
                      border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                      color: 'var(--foreground)', fontSize: '1rem', outline: 'none',
                      boxSizing: 'border-box', transition: 'border-color 0.2s'
                    }}
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: '#1e2330', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px', marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}>
                      {filteredSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={() => { setEmail(suggestion); setShowSuggestions(false); }}
                          style={{
                            width: '100%', padding: '0.75rem 1rem', textAlign: 'left',
                            background: 'none', border: 'none', color: 'var(--foreground)',
                            cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'none')}
                        >
                          <span style={{
                            width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {suggestion[0].toUpperCase()}
                          </span>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '9999px',
                    background: email.trim() ? 'var(--foreground)' : 'rgba(255,255,255,0.2)',
                    color: email.trim() ? 'var(--background)' : 'var(--muted)',
                    border: 'none', fontWeight: 700, fontSize: '1rem', cursor: email.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: '16px', height: '16px', border: '2px solid currentColor',
                        borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block'
                      }} />
                      Checking...
                    </>
                  ) : 'Next'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  Sign up
                </Link>
              </p>
              <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <Link href="/forgot-password" style={{ color: 'var(--accent)' }}>
                  Forgot password?
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── STEP 2a: PASSWORD (account exists) ─── */}
          {step === 'password' && (
            <motion.div
              key="password-step"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.25 }}
            >
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                Enter your password
              </h1>

              {/* Show which email */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', marginBottom: '1.5rem', marginTop: '1rem'
              }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                }}>
                  {email[0].toUpperCase()}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
                <button
                  onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{
                    color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                    Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '0.85rem 3rem 0.85rem 1rem', borderRadius: '8px',
                      border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                      color: 'var(--foreground)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(30%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password.trim()}
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '9999px',
                    background: password.trim() ? 'var(--foreground)' : 'rgba(255,255,255,0.2)',
                    color: password.trim() ? 'var(--background)' : 'var(--muted)',
                    border: 'none', fontWeight: 700, fontSize: '1rem',
                    cursor: password.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: '16px', height: '16px', border: '2px solid currentColor',
                        borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block'
                      }} />
                      Signing in...
                    </>
                  ) : 'Log in'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                  <Link href="/forgot-password" style={{ color: 'var(--accent)' }}>
                    Forgot password?
                  </Link>
                </p>
              </form>
            </motion.div>
          )}

          {/* ── STEP 2b: ACCOUNT NOT FOUND ─────────── */}
          {step === 'not-found' && (
            <motion.div
              key="not-found-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Account not found
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                No account is linked to
              </p>
              <p style={{
                fontWeight: 600, color: 'var(--foreground)', fontSize: '1rem',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '8px', padding: '0.5rem 1rem', display: 'inline-block', marginBottom: '1.5rem'
              }}>
                {email}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Would you like to create a new account with this email?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  href={`/register?email=${encodeURIComponent(email)}`}
                  style={{
                    display: 'block', padding: '0.85rem', borderRadius: '9999px',
                    background: 'var(--foreground)', color: 'var(--background)',
                    fontWeight: 700, fontSize: '1rem', textDecoration: 'none', textAlign: 'center'
                  }}
                >
                  Create account
                </Link>
                <button
                  onClick={() => { setStep('email'); setError(''); }}
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '9999px',
                    background: 'transparent', color: 'var(--foreground)',
                    border: '1.5px solid rgba(255,255,255,0.2)', fontWeight: 600, fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Try a different email
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
      `}</style>
    </div>
  );
}
