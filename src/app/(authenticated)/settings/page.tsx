"use client";
import { useState, useEffect } from 'react';
import {
  Bell, Lock, Globe, User, ShieldCheck, ChevronRight,
  CheckCircle, ArrowLeft, Eye, EyeOff, Smartphone, Download,
  Moon, Sun, Monitor, Key, Trash2, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getErrorMessage } from '@/lib/errors';
import type { ApiErrorResponse } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import type { Language } from '@/lib/i18n';

type Section =
  | 'root'
  | 'account'
  | 'profile'
  | 'security'
  | 'notifications'
  | 'display'
  | 'privacy';

interface SettingsState {
  email: string;
  phone: string;
  password: string;
  language: string;
  notificationPref: boolean;
  username: string;
  displayName: string;
  bio: string;
  dmPrivacy: string;
  tweetPrivacy: string;
  twoFactorEnabled: boolean;
}

// Twitter/X style toggle switch
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="x-toggle"
      style={{ background: value ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
      role="switch"
      aria-checked={value}
    >
      <div className="x-toggle-thumb" style={{ left: value ? '22px' : '2px' }} />
    </button>
  );
}

// Twitter/X style row item
function SettingsRow({ label, value, onClick, chevron = true, danger = false }: { label: string; value?: string; onClick?: () => void; chevron?: boolean; danger?: boolean }) {
  return (
    <div className="x-settings-row" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '1rem', fontWeight: 400, color: danger ? 'var(--error)' : 'var(--foreground)' }}>{label}</div>
        {value && <div style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginTop: '2px' }}>{value}</div>}
      </div>
      {chevron && onClick && <ChevronRight size={18} color="var(--muted)" />}
    </div>
  );
}

// Section header with optional back button
function SectionHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="x-header" style={{ gap: '16px' }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)', padding: '8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <ArrowLeft size={20} />
        </button>
      )}
      <span className="x-header-title">{title}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('root');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState<SettingsState>({
    email: '', phone: '', password: '', language: 'EN',
    notificationPref: true, username: '', displayName: '', bio: '',
    dmPrivacy: 'EVERYONE', tweetPrivacy: 'PUBLIC', twoFactorEnabled: false,
  });

  const [loginSessions, setLoginSessions] = useState<any[]>([]);
  const [show2faOtp, setShow2faOtp] = useState(false);
  const [twoFaOtp, setTwoFaOtp] = useState('');
  const [resetStep, setResetStep] = useState<null | 'OTP' | 'NEW_PASSWORD'>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { setLanguage, t } = useLanguage();
  const [showLangOtp, setShowLangOtp] = useState(false);
  const [langOtpCode, setLangOtpCode] = useState('');
  const [pendingLang, setPendingLang] = useState<Language | ''>('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/settings');
      const data = await res.json();
      if (data.user) {
        setForm({
          email: data.user.email || '', phone: data.user.phone || '',
          password: '', language: data.user.language || 'EN',
          notificationPref: data.user.notificationPref ?? true,
          username: data.user.username || '', displayName: data.user.displayName || '',
          bio: data.user.bio || '', dmPrivacy: data.user.dmPrivacy || 'EVERYONE',
          tweetPrivacy: data.user.tweetPrivacy || 'PUBLIC',
          twoFactorEnabled: data.user.twoFactorEnabled || false,
        });
      }
      const sessionsRes = await fetch('/api/user/sessions');
      const sessionsData = await sessionsRes.json();
      if (sessionsData.sessions) setLoginSessions(sessionsData.sessions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSave = async (patch: Partial<SettingsState>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (res.ok) showSuccess('Saved successfully');
    } catch (e) { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleToggle2FA = async () => {
    if (!form.twoFactorEnabled) { setShow2faOtp(true); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: false })
      });
      if (res.ok) { setForm(p => ({ ...p, twoFactorEnabled: false })); showSuccess('2FA disabled'); }
    } finally { setSaving(false); }
  };

  const handleConfirm2FA = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: true, code: twoFaOtp })
      });
      if (res.ok) {
        setForm(p => ({ ...p, twoFactorEnabled: true }));
        setShow2faOtp(false); setTwoFaOtp('');
        showSuccess('2FA enabled!');
      }
    } finally { setSaving(false); }
  };

  const handleRevokeSessions = async () => {
    setSaving(true);
    try {
      await fetch('/api/user/sessions', { method: 'DELETE' });
      const r = await fetch('/api/user/sessions');
      const d = await r.json();
      setLoginSessions(d.sessions || []);
      showSuccess('Other sessions revoked');
    } finally { setSaving(false); }
  };

  const handleRequestReset = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/user/request-reset-otp', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetStep('OTP'); showSuccess('OTP sent to your email');
    } catch (e) { setError(getErrorMessage(e, 'Failed to send OTP')); }
    finally { setSaving(false); }
  };

  const handleVerifyResetOtp = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'current', code: resetOtp, type: 'RESET_PASSWORD' })
      });
      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) throw new Error(data.error);
      setResetStep('NEW_PASSWORD');
    } catch (e) { setError(getErrorMessage(e, 'Invalid OTP')); }
    finally { setSaving(false); }
  };

  const handleFinalizeReset = async () => {
    if (!newPassword) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) { showSuccess('Password updated!'); setResetStep(null); setNewPassword(''); setResetOtp(''); }
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleLanguageChangeInit = async (newLang: string) => {
    if (newLang === form.language) return;
    setPendingLang(newLang as Language);
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/user/language-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShowLangOtp(true);
      if (data.mockSmsCode) {
        showSuccess(data.message);
      } else {
        showSuccess('OTP sent to your email.');
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to trigger language change'));
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyLangOtp = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'current', code: langOtpCode, type: 'LANGUAGE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      // OTP verified successfully. Now patch settings.
      const saveRes = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: pendingLang })
      });
      if (!saveRes.ok) throw new Error('Failed to save language setting');

      setForm(p => ({ ...p, language: pendingLang }));
      setLanguage(pendingLang as Language);
      showSuccess('Language updated successfully');
      setShowLangOtp(false);
      setLangOtpCode('');
      setPendingLang('');
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to verify language OTP'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Left nav items ───
  const navItems = [
    { id: 'account' as Section, label: t('profile'), icon: User },
    { id: 'security' as Section, label: t('security'), icon: ShieldCheck },
    { id: 'privacy' as Section, label: t('settings'), icon: Lock },
    { id: 'notifications' as Section, label: t('notifications'), icon: Bell },
    { id: 'display' as Section, label: t('display'), icon: Globe },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--muted)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--card-border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--accent)', color: 'white',
              padding: '12px 24px', borderRadius: '9999px',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 20px rgba(29,155,240,0.4)', zIndex: 1000,
              fontWeight: 700, fontSize: '0.9375rem',
            }}
          >
            <CheckCircle size={18} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Left Settings Nav ─── */}
      <div className="x-settings-nav">
        <div className="x-header">
          <span className="x-header-title">Settings</span>
        </div>
        <div style={{ paddingTop: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`x-settings-nav-item ${section === item.id ? 'active' : ''}`}
                onClick={() => setSection(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                <ChevronRight size={18} color="var(--muted)" style={{ marginLeft: 'auto' }} />
              </div>
            );
          })}
          <div className="x-divider" style={{ margin: '8px 0' }} />
          <div
            className="x-settings-nav-item"
            onClick={handleLogout}
            style={{ color: 'var(--error)', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            <span>Log out</span>
          </div>
        </div>
      </div>

      {/* ─── Right Content Panel ─── */}
      <div className="x-settings-content">
        {/* Error banner */}
        {error && (
          <div style={{ margin: '0', padding: '12px 16px', background: 'rgba(244,33,46,0.1)', borderBottom: '1px solid rgba(244,33,46,0.2)', color: 'var(--error)', fontSize: '0.9375rem' }}>
            {error}
          </div>
        )}

        {/* ─── Default state: show section list on mobile or "pick a setting" message on desktop ─── */}
        {section === 'root' && (
          <div>
            <div className="x-header"><span className="x-header-title">Settings</span></div>
            <div style={{ padding: '32px 16px', color: 'var(--muted)', fontSize: '1rem' }}>
              Select a setting category from the left panel to get started.
            </div>
          </div>
        )}

        {/* ─── Account Section ─── */}
        {section === 'account' && (
          <div>
            <SectionHeader title="Your account" />
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                See information about your account, download an archive of your data, or learn about your account deactivation options.
              </p>
            </div>

            <div style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Account information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="x-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>@</span>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="x-input"
                      placeholder="yourhandle"
                      style={{ paddingLeft: '28px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="x-label">Display name</label>
                  <input type="text" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="x-input" placeholder="Your Name" />
                </div>
                <div>
                  <label className="x-label">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="x-input" />
                </div>
                <div>
                  <label className="x-label">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="x-input" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="x-label">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="x-input" placeholder="Tell the world about yourself…" rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={() => handleSave({ username: form.username, displayName: form.displayName, email: form.email, phone: form.phone, bio: form.bio })}
                disabled={saving} className="btn btn-accent" style={{ marginTop: '20px' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div className="x-divider" />
            <div style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Data</h3>
              <SettingsRow label="Download an archive of your data" onClick={() => window.location.href = '/api/user/export'} />
            </div>
          </div>
        )}

        {/* ─── Security Section ─── */}
        {section === 'security' && (
          <div>
            <SectionHeader title="Security and account access" />
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Manage your account's security and keep track of your account's usage including apps that you have connected to your account.
              </p>
            </div>

            {/* 2FA */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Two-factor authentication</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '2px' }}>
                    {form.twoFactorEnabled ? 'Enabled — your account has extra protection.' : 'Protect your account with an extra layer of security.'}
                  </div>
                </div>
                <Toggle value={form.twoFactorEnabled} onChange={handleToggle2FA} />
              </div>
              <AnimatePresence>
                {show2faOtp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: '12px', padding: '16px', background: 'rgba(29,155,240,0.05)', border: '1px solid rgba(29,155,240,0.2)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '12px' }}>Enter the 6-digit code from SMS to enable 2FA:</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="x-input" placeholder="000 000" value={twoFaOtp}
                        onChange={e => setTwoFaOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem', flex: 1 }} />
                      <button onClick={handleConfirm2FA} disabled={saving || twoFaOtp.length < 6} className="btn btn-accent">
                        {saving ? '…' : 'Confirm'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password Reset */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>Password</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Change your password at any time. We'll send a verification code to your email first.
              </div>
              {!resetStep ? (
                <button onClick={handleRequestReset} disabled={saving} className="btn btn-secondary">
                  {saving ? 'Sending…' : 'Change password'}
                </button>
              ) : resetStep === 'OTP' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Enter the 6-digit code sent to {form.email}</p>
                  <input type="text" value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="x-input" placeholder="000 000" style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }} />
                  <button onClick={handleVerifyResetOtp} className="btn btn-accent">Verify code</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600 }}>✓ Identity verified. Set your new password:</p>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} className="x-input" placeholder="New password" style={{ paddingRight: '48px' }} />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button onClick={handleFinalizeReset} className="btn btn-accent">Update password</button>
                </div>
              )}
            </div>

            {/* Sessions */}
            <div style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>Active sessions</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Devices that are currently logged into your account.
              </div>
              {loginSessions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {loginSessions.map(session => (
                    <div key={session.id} style={{ padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{session.browserType || 'Unknown Browser'} on {session.os || 'Unknown OS'}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {session.ipAddress || 'Unknown IP'} · {new Date(session.loggedInAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: '16px' }}>No active sessions found.</p>
              )}
              <button onClick={handleRevokeSessions} disabled={saving} className="btn btn-danger">
                {saving ? 'Revoking…' : 'Log out all other sessions'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Privacy Section ─── */}
        {section === 'privacy' && (
          <div>
            <SectionHeader title="Privacy and safety" />
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Manage what information you share and how your content is visible to others.
              </p>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Protect your posts</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '2px' }}>Only your followers can see your posts</div>
                </div>
                <Toggle value={form.tweetPrivacy === 'FOLLOWERS'} onChange={(v) => {
                  const val = v ? 'FOLLOWERS' : 'PUBLIC';
                  setForm(p => ({ ...p, tweetPrivacy: val }));
                  handleSave({ tweetPrivacy: val });
                }} />
              </div>
              <div>
                <label className="x-label" style={{ marginBottom: '8px' }}>Who can send you Direct Messages</label>
                <select value={form.dmPrivacy} onChange={e => { setForm(p => ({ ...p, dmPrivacy: e.target.value })); handleSave({ dmPrivacy: e.target.value }); }} className="x-input">
                  <option value="EVERYONE">Everyone</option>
                  <option value="FOLLOWERS">People you follow</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ─── Notifications Section ─── */}
        {section === 'notifications' && (
          <div>
            <SectionHeader title="Notifications" />
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Select the types of notifications you receive about your activities, interests, and recommendations.
              </p>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Push notifications</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '2px' }}>Get notified about new likes, replies, and follows</div>
                </div>
                <Toggle value={form.notificationPref} onChange={(v) => {
                  setForm(p => ({ ...p, notificationPref: v }));
                  handleSave({ notificationPref: v });
                }} />
              </div>
            </div>
          </div>
        )}

        {/* ─── Display & Language Section ─── */}
        {section === 'display' && (
          <div>
            <SectionHeader title="Accessibility, display, and languages" />
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Manage how content is displayed to you, including font size, color, and language preferences.
              </p>
            </div>

            {/* Theme */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>Background</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { key: 'light', label: 'Light', icon: Sun, bg: '#ffffff', fg: '#0f1419' },
                  { key: 'dark', label: 'Dim', icon: Moon, bg: '#15202b', fg: '#f7f9f9' },
                  { key: 'system', label: 'System', icon: Monitor, bg: '#000000', fg: '#e7e9ea' },
                ].map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${theme === t.key ? 'var(--accent)' : 'var(--card-border)'}`,
                      background: theme === t.key ? 'rgba(29,155,240,0.1)' : 'var(--card-bg)',
                      color: 'var(--foreground)', fontFamily: 'inherit', display: 'flex',
                      flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'border-color 0.2s',
                    }}>
                    <t.icon size={20} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Display language</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '16px' }}>Select the language you want to use on X.</p>
              <select value={form.language} onChange={e => handleLanguageChangeInit(e.target.value)} className="x-input">
                <option value="EN">English</option>
                <option value="HI">Hindi</option>
                <option value="ES">Spanish</option>
                <option value="PT">Portuguese</option>
                <option value="ZH">Chinese</option>
                <option value="FR">French</option>
              </select>

              {showLangOtp && (
                <div style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--accent)', borderRadius: '12px', background: 'rgba(29, 155, 240, 0.05)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>Verify Identity to Change Language</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '12px' }}>
                    {pendingLang === 'FR' 
                      ? 'Please enter the 6-digit OTP sent to your registered email address.' 
                      : 'Please enter the 6-digit OTP sent to your registered mobile number.'}
                  </p>
                  <input
                    type="text"
                    value={langOtpCode}
                    onChange={e => setLangOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="x-input"
                    style={{ marginBottom: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={handleVerifyLangOtp} disabled={saving || langOtpCode.length < 4} style={{ padding: '8px 16px', flex: 1 }}>
                      {saving ? 'Verifying...' : 'Verify'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setShowLangOtp(false); setPendingLang(''); }} style={{ padding: '8px 16px', flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
