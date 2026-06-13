"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.');
  }, [token]);

  const strength = (() => {
    if (!password) return null;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (s <= 1) return { label: 'Weak', color: '#ef4444', w: '25%' };
    if (s === 2) return { label: 'Fair', color: '#f59e0b', w: '50%' };
    if (s === 3) return { label: 'Good', color: '#3b82f6', w: '75%' };
    return { label: 'Strong', color: '#22c55e', w: '100%' };
  })();

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setConfirm(newPassword);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
    border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--foreground)', fontSize: '1rem', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--background)', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo size={44} />
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Password reset!
            </h1>
            <p style={{ color: '#71767b', marginBottom: '1.5rem' }}>
              Your password has been changed. Redirecting to login...
            </p>
            <Link href="/login" style={{
              display: 'block', padding: '0.875rem', borderRadius: '9999px',
              background: '#e7e9ea', color: '#0f1117',
              fontWeight: 700, fontSize: '1rem', textDecoration: 'none', textAlign: 'center'
            }}>
              Go to Login
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              Set new password
            </h1>
            <p style={{ color: '#71767b', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div style={{
                color: '#f4212e', background: 'rgba(244,33,46,0.1)',
                border: '1px solid rgba(244,33,46,0.25)', borderRadius: '8px',
                padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem',
              }}>
                {error}
                {!token && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link href="/forgot-password" style={{ color: '#1d9bf0', fontWeight: 600 }}>
                      Request a new reset link →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* New Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                      New password
                    </label>
                    <button type="button" onClick={generatePassword} style={{ background: 'rgba(29,155,240,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(29,155,240,0.3)', color: '#1d9bf0', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      Generate Random
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required autoFocus
                      style={{ ...inputStyle, paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71767b', fontSize: '1.1rem' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: strength.w, background: strength.color, transition: 'all 0.3s' }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: strength.color, textAlign: 'right', marginTop: '2px' }}>
                        {strength.label}
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
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    style={{
                      ...inputStyle,
                      borderColor: confirm && password !== confirm ? 'rgba(244,33,46,0.5)' : 'rgba(255,255,255,0.12)'
                    }}
                  />
                  {confirm && password !== confirm && (
                    <p style={{ color: '#f4212e', fontSize: '0.75rem', marginTop: '4px' }}>Passwords don&apos;t match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || password !== confirm}
                  style={{
                    width: '100%', padding: '0.875rem', borderRadius: '9999px',
                    background: (!loading && password && password === confirm) ? '#e7e9ea' : 'rgba(255,255,255,0.12)',
                    color: (!loading && password && password === confirm) ? '#0f1117' : 'rgba(255,255,255,0.4)',
                    border: 'none', fontWeight: 700, fontSize: '1rem',
                    cursor: (!loading && password && password === confirm) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />
                      Saving...
                    </>
                  ) : 'Reset password'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#71767b' }}>
                  <Link href="/login" style={{ color: '#1d9bf0' }}>Back to login</Link>
                </p>
              </form>
            )}
          </motion.div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #1d9bf0 !important; box-shadow: 0 0 0 3px rgba(29,155,240,0.15) !important; }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
