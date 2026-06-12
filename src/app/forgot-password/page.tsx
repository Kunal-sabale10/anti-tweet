"use client";
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Key, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';

type ApiResponse = {
  success?: boolean;
  emailSent?: boolean;
  resetUrl?: string;
  error?: string;
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json() as ApiResponse;
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (result?.resetUrl) {
      navigator.clipboard.writeText(result.resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem 0.875rem 3rem',
    borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)',
    fontSize: '1rem', boxSizing: 'border-box', outline: 'none',
  };

  // ── SUCCESS: email was sent ───────────────────────────────────────────────
  if (result?.success && result.emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--background)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ color: '#22c55e', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={72} style={{ margin: '0 auto' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Check your inbox!</h1>
          <p style={{ color: '#71767b', marginBottom: '0.5rem', lineHeight: 1.6 }}>
            We sent a reset link to <strong style={{ color: '#e7e9ea' }}>{email}</strong>.
          </p>
          <p style={{ color: '#71767b', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Check your spam folder if it doesn't appear. Link expires in 15 minutes.
          </p>
          
          {result.resetUrl && (
            <div style={{ marginTop: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(29,155,240,0.05)', border: '1px solid rgba(29,155,240,0.15)', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Didn't receive the email?</p>
              <a href={result.resetUrl} style={{ color: '#1d9bf0', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <ExternalLink size={14} /> Use this backup link to reset
              </a>
            </div>
          )}

          <Link href="/login" style={{
            display: 'block', padding: '0.875rem', borderRadius: '9999px',
            background: '#e7e9ea', color: '#0f1117', fontWeight: 700,
            textDecoration: 'none', fontSize: '1rem',
          }}>
            Back to login
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── SUCCESS: no email config — show link on screen ───────────────────────
  if (result?.success && result.resetUrl) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--background)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔑</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reset link ready!</h1>
            <p style={{ color: '#71767b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Click the button below or copy the link to reset your password.<br />
              <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⚠️ This link expires in 15 minutes.</span>
            </p>
          </div>

          {/* Big CTA button */}
          <a
            href={result.resetUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.95rem', borderRadius: '9999px', background: '#1d9bf0',
              color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
              marginBottom: '1rem', boxShadow: '0 4px 20px rgba(29,155,240,0.35)',
            }}
          >
            <ExternalLink size={18} /> Reset my password now
          </a>

          {/* Copy link */}
          <button
            onClick={copyLink}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.85rem', borderRadius: '9999px', border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: copied ? '#22c55e' : 'var(--foreground)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1.5rem',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy reset link</>}
          </button>

          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#f59e0b' }}>No email received?</strong> To enable real emails, add{' '}
            <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', padding: '1px 5px' }}>GMAIL_USER</code>{' '}
            and{' '}
            <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', padding: '1px 5px' }}>GMAIL_APP_PASSWORD</code>{' '}
            to your Vercel environment variables.
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#71767b' }}>
            <Link href="/login" style={{ color: '#1d9bf0' }}>← Back to login</Link>
          </p>
        </motion.div>
      </div>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#71767b', fontSize: '0.9rem', marginBottom: '2rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(29,155,240,0.12)', border: '1px solid rgba(29,155,240,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', color: '#1d9bf0',
          }}>
            <Key size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>Forgot password?</h1>
          <p style={{ color: '#71767b', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Enter your email and we'll give you a reset link.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                color: '#f4212e', background: 'rgba(244,33,46,0.08)',
                border: '1px solid rgba(244,33,46,0.2)', borderRadius: '8px',
                padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71767b', pointerEvents: 'none' }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required autoFocus
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            style={{
              width: '100%', padding: '0.875rem', borderRadius: '9999px',
              background: (loading || !email) ? 'rgba(255,255,255,0.12)' : '#e7e9ea',
              color: (loading || !email) ? 'rgba(255,255,255,0.4)' : '#0f1117',
              border: 'none', fontWeight: 700, fontSize: '1rem',
              cursor: (loading || !email) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <span style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />
                Sending...
              </>
            ) : 'Get reset link'}
          </button>
        </form>
      </motion.div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #1d9bf0 !important; box-shadow: 0 0 0 3px rgba(29,155,240,0.12) !important; }
      `}</style>
    </div>
  );
}
