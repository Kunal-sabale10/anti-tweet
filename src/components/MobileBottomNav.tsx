"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Home, Search, SquarePen, User } from "lucide-react";

const tabs = [
  { label: "Home", href: "/dashboard", publicHref: "/", icon: Home, match: ["/", "/dashboard"] },
  { label: "Search", href: "/explore", publicHref: "/login?next=/explore", icon: Search, match: ["/explore", "/hashtag"] },
  { label: "Compose", href: "#compose", publicHref: "/login", icon: SquarePen, match: [] },
  { label: "Notifications", href: "/notification", publicHref: "/login?next=/notification", icon: Bell, match: ["/notification"] },
  { label: "Profile", href: "/profile", publicHref: "/login?next=/profile", icon: User, match: ["/profile"] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((item) => pathname === item || (item !== "/" && pathname.startsWith(`${item}/`)));
}

export default function MobileBottomNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleCompose = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    window.dispatchEvent(new CustomEvent("open-tweet-modal"));
  };

  return (
    <nav
      className="mobile-bottom-nav border-t border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur-xl"
      aria-label="Primary mobile navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(pathname, tab.match);
        const className = [
          "mobile-bottom-nav__item",
          active ? "is-active" : "",
          active ? "text-[var(--accent)]" : "text-[var(--muted)]",
        ].filter(Boolean).join(" ");

        if (tab.label === "Compose") {
          return (
            <button
              key={tab.label}
              type="button"
              aria-label="Compose post"
              onClick={handleCompose}
              className="mobile-bottom-nav__item text-[var(--accent)]"
            >
              <span className="mobile-bottom-nav__compose">
                <Icon size={23} strokeWidth={2.4} />
              </span>
              <span className="sr-only">Compose</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.label}
            href={isAuthenticated ? tab.href : tab.publicHref}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            <Icon
              size={23}
              strokeWidth={active ? 2.5 : 2}
              fill={active ? "currentColor" : "none"}
            />
            <span className="sr-only">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
