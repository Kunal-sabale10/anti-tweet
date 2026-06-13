"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SessionPayload } from "@/lib/types";
import Logo from "@/components/Logo";
import MobileBottomNav from "@/components/MobileBottomNav";
import Nav from "@/components/Nav";

const appRoutePrefixes = [
  "/analytics",
  "/bookmarks",
  "/checkout",
  "/circle",
  "/communities",
  "/creator-studio",
  "/dashboard",
  "/explore",
  "/grok",
  "/hashtag",
  "/jobs",
  "/lists",
  "/messages",
  "/notification",
  "/premium",
  "/profile",
  "/settings",
  "/topics",
  "/tweet",
];

function isAppRoute(pathname: string) {
  return appRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function RootChrome({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionPayload | null;
}) {
  const pathname = usePathname();
  const embedRoute = pathname.startsWith("/embed/");
  const authenticatedAppRoute = isAppRoute(pathname);
  const showPublicChrome = !authenticatedAppRoute && !embedRoute;
  const showMobileNav = !embedRoute;

  return (
    <div className={showPublicChrome ? "flex min-h-[100dvh] flex-col" : "min-h-[100dvh]"}>
      {showPublicChrome && (
        <header className="glass-panel sticky top-0 z-[100] flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-2.5 no-underline">
            <Logo size={36} />
            <h1 className="m-0 bg-gradient-to-br from-blue-300 via-blue-500 to-indigo-400 bg-clip-text text-xl font-extrabold tracking-normal text-transparent">
              Anti-Tweet
            </h1>
          </Link>
          <div className="hidden md:block">
            <Nav user={session} />
          </div>
          <Link
            href={session ? "/explore" : "/login"}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--muted)] md:hidden"
            aria-label="Search"
          >
            <Search size={22} />
          </Link>
        </header>
      )}

      {showPublicChrome ? (
        <>
          <main className="flex-1 px-4 py-6 pb-[calc(64px+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:pb-8 lg:px-8">
            {children}
          </main>
          <footer className="hidden border-t border-[var(--card-border)] p-8 text-center text-sm text-[var(--muted)] md:block">
            &copy; {new Date().getFullYear()} Anti-Tweet Platform. Secure & Premium.
          </footer>
        </>
      ) : (
        children
      )}

      {showMobileNav && <MobileBottomNav isAuthenticated={!!session} />}
    </div>
  );
}
