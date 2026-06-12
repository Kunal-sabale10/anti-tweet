"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';

type Step = 'email' | 'password' | 'not-found';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved emails from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('at_emails') || '[]') as string[];
      setSavedEmails(saved);
    } catch { setSavedEmails([]); }
  }, []);

  const saveEmail = (e: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem('at_emails') || '[]') as string[];
      const updated = [e, ...saved.filter(s => s !== e)].slice(0, 8);
      localStorage.setItem('at_emails', JSON.stringify(updated));
      setSavedEmails(updated);
    } catch { /* ignore */ }
  };

  const removeEmail = (e: string) => {
    const updated = savedEmails.filter(s => s !== e);
    localStorage.setItem('at_emails', JSON.stringify(updated));
    setSavedEmails(updated);
  };

  // Filtered suggestions: saved emails that match what's typed
  const suggestions = savedEmails.filter(e =>
    email.length === 0 || e.toLowerCase().includes(email.toLowerCase())
  );

  // ── Step 1: check if email exists in DB ──────────────────────────────────
  const handleEmailNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    setShowDropdown(false);

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed })
      });
      const data = await res.json() as { exists: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to check email');

      setEmail(trimmed); // normalize display too
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

  // ── Step 2: login with password ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json() as { success?: boolean; redirect?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.success) {
        saveEmail(email); // persist on successful login
        window.location.href = data.redirect || '/dashboard';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('email');
    setPassword('');
    setError('');
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.9rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--foreground)',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  };

  const pillBtn = (active: boolean, fullWidth = true): React.CSSProperties => ({
    ...(fullWidth ? { width: '100%' } : {}),
    padding: '0.875rem 1.5rem',
    borderRadius: '9999px',
    background: active ? '#e7e9ea' : 'rgba(255,255,255,0.12)',
    color: active ? '#0f1117' : 'rgba(255,255,255,0.4)',
    border: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: active ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Logo size={44} />
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════ STEP 1: EMAIL ══════════════ */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22 }}
            >
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem', lineHeight: 1.2 }}>
                Sign in to Anti-Tweet
              </h1>
              <p style={{ color: '#71767b', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Enter your email to continue
              </p>

              {/* ── Saved Accounts selector (if any) ── */}
              {savedEmails.length > 0 && email.length === 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.78rem', color: '#71767b', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Saved accounts
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {savedEmails.map(saved => (
                      <button
                        key={saved}
                        onClick={() => { setEmail(saved); inputRef.current?.focus(); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.65rem 0.85rem', borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'background 0.15s',
                          color: 'var(--foreground)',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      >
                        {/* Avatar circle */}
                        <span style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0
                        }}>
                          {saved[0].toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {saved}
                        </span>
                        {/* Remove saved email */}
                        <span
                          role="button"
                          title="Remove"
                          onClick={ev => { ev.stopPropagation(); removeEmail(saved); }}
                          style={{ color: '#71767b', fontSize: '1rem', padding: '4px', borderRadius: '50%', flexShrink: 0, lineHeight: 1 }}
                        >
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ color: '#71767b', fontSize: '0.8rem' }}>or use another email</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              )}

              {error && <ErrorBox msg={error} />}

              {/* Email form */}
              <form onSubmit={handleEmailNext} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                    placeholder="Email address"
                    required
                    autoComplete="email"
                    style={inputStyle}
                  />

                  {/* Inline autocomplete dropdown */}
                  {showDropdown && email.length > 0 && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 99,
                      background: '#16181c', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                      {suggestions.map(s => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={() => { setEmail(s); setShowDropdown(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            width: '100%', padding: '0.7rem 1rem', background: 'none',
                            border: 'none', color: 'var(--foreground)', cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            textAlign: 'left',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'none')}
                        >
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {s[0].toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.9rem' }}>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || !email.trim()} style={pillBtn(!loading && !!email.trim())}>
                  {loading
                    ? <Spinner label="Checking..." />
                    : 'Next'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: '#71767b', fontSize: '0.8rem' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#71767b' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: '#1d9bf0', fontWeight: 600 }}>Sign up</Link>
              </p>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                <Link href="/forgot-password" style={{ color: '#1d9bf0' }}>Forgot password?</Link>
              </p>
            </motion.div>
          )}

          {/* ══════════════ STEP 2: PASSWORD ══════════════ */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22 }}
            >
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem', lineHeight: 1.2 }}>
                Enter your password
              </h1>

              {/* Account chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.85rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                margin: '1rem 0 1.5rem',
              }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#fff', flexShrink: 0 }}>
                  {email[0]?.toUpperCase()}
                </span>
                <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', color: '#e7e9ea' }}>
                  {email}
                </span>
                <button onClick={goBack} style={{ background: 'none', border: 'none', color: '#1d9bf0', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', flexShrink: 0 }}>
                  Change
                </button>
              </div>

              {error && <ErrorBox msg={error} />}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoFocus
                    style={{ ...inputStyle, paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71767b', padding: '4px', lineHeight: 1 }}
                    aria-label={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword
                      ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>

                <button type="submit" disabled={loading || !password.trim()} style={pillBtn(!loading && !!password.trim())}>
                  {loading ? <Spinner label="Signing in..." /> : 'Log in'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                  <Link href="/forgot-password" style={{ color: '#1d9bf0' }}>Forgot password?</Link>
                </p>
              </form>
            </motion.div>
          )}

          {/* ══════════════ STEP 3: NOT FOUND ══════════════ */}
          {step === 'not-found' && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Account not found
              </h2>
              <p style={{ color: '#71767b', lineHeight: 1.6, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                No Anti-Tweet account is linked to
              </p>
              <div style={{
                display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '8px',
                background: 'rgba(29,155,240,0.1)', border: '1px solid rgba(29,155,240,0.25)',
                color: '#1d9bf0', fontWeight: 600, fontSize: '0.95rem', marginBottom: '1.5rem',
                wordBreak: 'break-all',
              }}>
                {email}
              </div>
              <p style={{ color: '#71767b', fontSize: '0.875rem', marginBottom: '2rem' }}>
                This email has not been registered yet. Please sign up first.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  href={`/register?email=${encodeURIComponent(email)}`}
                  style={{
                    display: 'block', padding: '0.875rem', borderRadius: '9999px',
                    background: '#e7e9ea', color: '#0f1117',
                    fontWeight: 700, fontSize: '1rem', textDecoration: 'none', textAlign: 'center'
                  }}
                >
                  Create account with this email
                </Link>
                <button
                  onClick={goBack}
                  style={{
                    padding: '0.875rem', borderRadius: '9999px', cursor: 'pointer',
                    background: 'transparent', color: '#e7e9ea',
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    fontWeight: 600, fontSize: '1rem', width: '100%'
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
          border-color: #1d9bf0 !important;
          box-shadow: 0 0 0 3px rgba(29,155,240,0.15) !important;
        }
      `}</style>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function ErrorBox({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        color: '#f4212e', background: 'rgba(244,33,46,0.1)',
        border: '1px solid rgba(244,33,46,0.25)', borderRadius: '8px',
        padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem',
      }}
    >
      {msg}
    </motion.div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
      <span style={{
        width: '16px', height: '16px', border: '2px solid currentColor',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.75s linear infinite', display: 'inline-block', flexShrink: 0
      }} />
      {label}
    </span>
  );
}
