"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Tag, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "./CartProvider";

/**
 * App-style bottom navigation for phones. Hidden on the product page, which has its own
 * sticky Buy bar, and inside the ops console, which is a different product entirely.
 */
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { count } = useCart();

  const hidden =
    pathname.startsWith("/ops") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/label") ||
    /^\/shop\/[^/]+$/.test(pathname);
  if (hidden) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/shop", label: "Shop", icon: Search, active: pathname.startsWith("/shop") },
    { href: "/sell", label: "Sell", icon: Tag, active: pathname.startsWith("/sell") },
    { href: "/cart", label: "Cart", icon: ShoppingCart, active: pathname.startsWith("/cart"), badge: count },
    {
      href: signedIn ? "/account" : "/login",
      label: signedIn ? "Account" : "Sign in",
      icon: UserRound,
      active: pathname.startsWith("/account") || pathname.startsWith("/login"),
    },
  ];

  return (
    <>
      {/* Keeps page content clear of the fixed bar */}
      <div className="h-16 sm:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg items-stretch">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                t.active ? "text-brand" : "text-muted"
              }`}
            >
              <span className="relative">
                <t.icon size={19} />
                {t.badge ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-brand-fg">
                    {t.badge}
                  </span>
                ) : null}
              </span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
