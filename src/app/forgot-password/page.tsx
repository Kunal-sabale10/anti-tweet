"use client";
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Key, CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import type { ApiErrorResponse } from '@/lib/types';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel" 
        style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}
      >
        <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Email Sent</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a new temporary password. 
              Please check your inbox (including spam).
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Note: You can only request one password reset per 24 hours.
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent)' }}>
                <Key size={30} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Forgot Password?</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No worries! Enter your email and we&apos;ll send you a new temporary access key.</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="input-field" 
                    placeholder="name@example.com" 
                    style={{ paddingLeft: '3rem' }}
                    required 
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                {loading ? 'Processing...' : 'Send Temporary Password'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
