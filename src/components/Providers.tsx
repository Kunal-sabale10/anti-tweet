"use client";
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import type { Language } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  const [initialLang, setInitialLang] = useState<Language>('EN');

  useEffect(() => {
    async function getLang() {
      try {
        const res = await fetch('/api/user/settings');
        const data = await res.json();
        if (data.user?.language) {
          setInitialLang(data.user.language);
        }
      } catch {
        // default to EN
      }
    }
    getLang();

    // Setup Push Notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-3qUXGVA1aL6gO09Jz5p_Vw' // Mock public key
          });
          
          await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          console.warn('Push registration failed or denied by user.', e);
        }
      });
    }
  }, []);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider initialLanguage={initialLang}>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
