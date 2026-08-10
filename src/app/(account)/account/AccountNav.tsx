"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Tag, ShoppingBag, Wallet, CalendarCheck, UserRound, Heart, Bell } from "lucide-react";

const TABS = [
  { href: "/account", label: "Overview", icon: LayoutGrid },
  { href: "/account/selling", label: "Selling", icon: Tag },
  { href: "/account/orders", label: "Orders", icon: ShoppingBag },
  { href: "/account/saved", label: "Saved", icon: Heart },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/visits", label: "Visits", icon: CalendarCheck },
  { href: "/account/notifications", label: "Alerts", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

/** Sidebar on desktop, a scrollable strip on phones — one nav, two shapes. */
export function AccountNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <nav aria-label="Account sections">
      {/* Phone */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive(t.href)
                ? "bg-brand text-brand-fg"
                : "border border-border bg-surface text-muted"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </Link>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-0.5">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(t.href)
                  ? "bg-brand text-brand-fg"
                  : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
