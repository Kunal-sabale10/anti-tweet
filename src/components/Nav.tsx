"use client";
import Link from 'next/link';
import type { SessionPayload } from '@/lib/types';

export default function Nav({ user }: { user: SessionPayload | null }) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
      <Link href="/" style={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>Home</Link>
      {user ? (
        <>
          <Link href="/dashboard" style={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>Dashboard</Link>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" style={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>Login</Link>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <span className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem' }}>
              Get Started
            </span>
          </Link>
        </>
      )}
    </nav>
  );
}
