"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export function HeaderNav({ items, locale }: { items: NavItem[]; locale: string }) {
  const pathname = usePathname() || "/";

  function isActive(href: string): boolean {
    // Normalize: strip trailing slash.
    const path = pathname.replace(/\/+$/, "") || "/";
    const target = href.replace(/\/+$/, "") || "/";
    if (target === `/${locale}`) {
      // Home: exact match only (not a prefix match).
      return path === target;
    }
    return path === target || path.startsWith(`${target}/`);
  }

  return (
    <nav className="hidden items-center gap-7 text-[15px] md:flex">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative py-1 transition ${active ? "text-[color:var(--accent)]" : "text-[color:var(--foreground)]"}`}
          >
            {item.label}
            {active && (
              <span
                className="absolute right-0 -bottom-0.5 left-0 h-px bg-[color:var(--accent)]"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
