import type { Metadata, Viewport } from "next";
import Link from 'next/link';
import "./globals.css";
import { getSession } from "@/lib/auth";
import Nav from "@/components/Nav";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: "Anti-Tweet",
  description: "A secure, modern, and premium social platform.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: '/logo.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/logo.png', sizes: '512x512', type: 'image/png' }],
    shortcut: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Anti-Tweet",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '1rem 2rem', borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              {/* AT geometric logo — inlined SVG (server component safe) */}
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="rl-a" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#93c5fd" />
                    <stop offset="50%"  stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="rl-b" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" rx="22" fill="#0f172a" />
                <polygon points="50,6 88,27 88,73 50,94 12,73 12,27" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.25" />
                <polygon points="50,14 82,32 82,68 50,86 18,68 18,32" fill="none" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.15" transform="rotate(30 50 50)" />
                <line x1="10" y1="82" x2="29" y2="16" stroke="url(#rl-a)" strokeWidth="9.5" strokeLinecap="round" />
                <line x1="29" y1="16" x2="48" y2="82" stroke="url(#rl-a)" strokeWidth="9.5" strokeLinecap="round" />
                <line x1="18" y1="55" x2="40" y2="55" stroke="url(#rl-b)" strokeWidth="8.5" strokeLinecap="round" />
                <line x1="50" y1="16" x2="90" y2="16" stroke="url(#rl-a)" strokeWidth="9.5" strokeLinecap="round" />
                <line x1="70" y1="16" x2="70" y2="82" stroke="url(#rl-a)" strokeWidth="9.5" strokeLinecap="round" />
                <circle cx="29" cy="16" r="5" fill="#93c5fd" fillOpacity="0.9" />
                <circle cx="50" cy="16" r="4" fill="#6366f1" fillOpacity="0.85" />
                <circle cx="90" cy="16" r="4" fill="#6366f1" fillOpacity="0.7" />
              </svg>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 55%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, cursor: 'pointer', letterSpacing: '-0.4px' }}>
                Anti-Tweet
              </h1>
            </Link>
            <Nav user={session} />
          </header>
          
          <main style={{ flex: 1, padding: '2rem' }}>
            {children}
          </main>
          
          <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', borderTop: '1px solid var(--card-border)' }}>
            &copy; {new Date().getFullYear()} Anti-Tweet Platform. Secure & Premium.
          </footer>
        </div>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    // SW registered successfully
                  }).catch(function(err) {
                    // Silently ignore SW registration errors (e.g. in incognito mode or dev)
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
