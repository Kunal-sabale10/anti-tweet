"use client";
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';

function RegisterForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('EN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength
  const passwordStrength = (() => {
    if (password.length === 0) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
    if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#3b82f6', width: '75%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  })();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          language
        })
      });
      const data = await res.json() as { success?: boolean; redirect?: string; error?: string };

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard';
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--background)'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome to Anti-Tweet!</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Setting up your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--background)', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo size={48} />
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              height: '3px', width: '40px', borderRadius: '2px',
              background: step >= s ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
          {step === 1 ? 'Create your account' : 'Set your password'}
        </h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {step === 1 ? 'Fill in your basic details below.' : 'Choose a strong password to secure your account.'}
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center',
              marginBottom: '1rem'
            }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Email */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus={!prefillEmail}
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  Phone number <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9999999999"
                  style={inputStyle}
                />
              </div>

              {/* Language */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  <option value="EN">English</option>
                  <option value="HI">Hindi</option>
                  <option value="ES">Spanish</option>
                  <option value="FR">French</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => { setError(''); if (!email.trim()) { setError('Please enter your email.'); return; } setStep(2); }}
                disabled={!email.trim()}
                style={primaryBtnStyle(!!email.trim())}
              >
                Next
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRegister}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Password */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoFocus
                    style={{ ...inputStyle, paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Strength bar */}
                {passwordStrength && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: passwordStrength.width, background: passwordStrength.color, transition: 'all 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: passwordStrength.color, marginTop: '2px', textAlign: 'right' }}>
                      {passwordStrength.label}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  style={{
                    ...inputStyle,
                    borderColor: confirmPassword && password !== confirmPassword
                      ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'
                  }}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>Passwords don&apos;t match</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '0.85rem', borderRadius: '9999px', border: '1.5px solid rgba(255,255,255,0.2)',
                    background: 'transparent', color: 'var(--foreground)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !password || password !== confirmPassword}
                  style={{ ...primaryBtnStyle(!loading && !!password && password === confirmPassword), flex: 2 }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      Creating...
                    </span>
                  ) : 'Create account'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
          outline: none;
        }
      `}</style>
    </div>
  );
}

// Shared styles
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', borderRadius: '8px',
  border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
  color: 'var(--foreground)', fontSize: '1rem', boxSizing: 'border-box', transition: 'border-color 0.2s'
};

const primaryBtnStyle = (active: boolean): React.CSSProperties => ({
  width: '100%', padding: '0.85rem', borderRadius: '9999px',
  background: active ? 'var(--foreground)' : 'rgba(255,255,255,0.2)',
  color: active ? 'var(--background)' : 'var(--muted)',
  border: 'none', fontWeight: 700, fontSize: '1rem',
  cursor: active ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
});

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
