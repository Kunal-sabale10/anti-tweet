import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Flag, UserX, Lock, EyeOff } from 'lucide-react';

export default function SafetyCenter() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Safety Center</h1>
      </div>

      <div style={{ padding: '3rem 2rem', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(168,85,247,0.1))', border: '1px solid var(--card-border)', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 1rem' }}>Your Safety is our Priority</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', marginInline: 'auto', lineHeight: 1.6 }}>
          We are committed to providing a safe, inclusive, and harassment-free environment for everyone. Learn about our safety tools and policies below.
        </p>
      </div>

      <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Safety Tools</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {[
          { icon: <UserX size={24} />, title: "Blocking & Muting", desc: "Control who can interact with you. Block to completely sever ties, or mute to quietly hide their posts from your feed." },
          { icon: <Flag size={24} />, title: "Reporting Violations", desc: "If you see something that breaks our rules, use the 'Report' option on any tweet or profile to alert our moderation team." },
          { icon: <Lock size={24} />, title: "Protected Accounts", desc: "Change your Tweet Privacy to 'Followers' in your Settings to manually approve who can follow you and see your posts." },
          { icon: <EyeOff size={24} />, title: "Content Filtering", desc: "Our automated systems filter out heavily profane or abusive language to keep your experience clean." }
        ].map(item => (
          <div key={item.title} className="safety-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', display: 'flex', gap: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{item.title}</h4>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--card-border)' }}>
        <p style={{ color: 'var(--muted)' }}>Need immediate assistance with a safety issue?</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Contact Support</button>
      </div>
    </div>
  );
}
