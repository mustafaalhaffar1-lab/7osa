"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, HandCoins, AlertCircle } from "lucide-react";

const TABS = [
  { href: "/ops/inventory/products", label: "Products", icon: Package, key: "products" as const },
  { href: "/ops/inventory/offers", label: "Offers", icon: HandCoins, key: "offers" as const },
  { href: "/ops/inventory/unsold", label: "Needs a decision", icon: AlertCircle, key: "unsold" as const },
];

export function InventoryNav({
  counts,
}: {
  counts: { products: number; offers: number; unsold: number };
}) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
      <p className="mt-0.5 text-sm text-muted">
        Every item we hold, the offers on them, and the ones that have stopped moving.
      </p>

      <nav className="mt-4 flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          const count = counts[t.key];
          // Offers and stuck stock are work waiting on someone — make that visible.
          const urgent = (t.key === "offers" || t.key === "unsold") && count > 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active ? "bg-brand text-brand-fg" : "border border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <t.icon size={14} /> {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active
                    ? "bg-brand-fg/20"
                    : urgent
                      ? "bg-accent/15 text-accent"
                      : "bg-bg text-muted"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
