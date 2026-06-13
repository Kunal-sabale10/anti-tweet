import Link from 'next/link';
import { ArrowLeft, LifeBuoy, ShieldAlert, MessageCircle, FileText, Settings, Shield } from 'lucide-react';

export default function HelpCenter() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Help Center</h1>
      </div>

      <div style={{ padding: '2rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 0 }}>
          <LifeBuoy size={24} color="var(--accent)" /> How can we help you?
        </h2>
        <input 
          type="text" 
          placeholder="Search for articles or topics..." 
          className="input-field"
          style={{ width: '100%', marginTop: '1rem' }}
        />
      </div>

      <div className="help-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[
          { icon: <Settings size={20} />, title: "Managing your account", desc: "Learn about account settings, privacy, and password resets." },
          { icon: <MessageCircle size={20} />, title: "Using Anti-Tweet", desc: "How to post, reply, retweet, and use the platform." },
          { icon: <Shield size={20} />, title: "Safety and security", desc: "Two-factor authentication, reporting, and safety tools." },
          { icon: <FileText size={20} />, title: "Rules and policies", desc: "Our terms of service and community guidelines." }
        ].map(item => (
          <div key={item.title} style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', transition: 'background 0.2s', cursor: 'pointer' }} className="help-card">
            <div style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>{item.icon}</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{item.title}</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .help-card:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>
    </div>
  );
}
