"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Workflow, Package, Receipt, Users, Settings } from "lucide-react";

const TABS = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/ops/products", label: "Products", icon: Package },
  { href: "/ops/orders", label: "Orders", icon: Receipt },
  { href: "/ops/users", label: "Users", icon: Users },
  { href: "/ops/settings", label: "Settings", icon: Settings },
];

export function OpsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand text-brand-fg" : "text-muted hover:bg-bg hover:text-ink"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
