import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import RootChrome from "@/components/RootChrome";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  title: "Anti-Tweet",
  description: "A secure, modern, and premium social platform.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/logo.png",
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
      <body className="overflow-x-hidden text-base">
        <Providers>
          <RootChrome session={session}>{children}</RootChrome>
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
