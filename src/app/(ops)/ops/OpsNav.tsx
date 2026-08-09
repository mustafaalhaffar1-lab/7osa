"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  Package,
  Receipt,
  Users,
  Settings,
  CalendarCheck,
  HandCoins,
  Truck,
  AlertCircle,
  Undo2,
  PackageCheck,
} from "lucide-react";

const TABS = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/visits", label: "Visits", icon: CalendarCheck },
  { href: "/ops/logistics", label: "Dispatch", icon: Truck },
  { href: "/ops/receiving", label: "Receiving", icon: PackageCheck },
  { href: "/ops/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/ops/products", label: "Products", icon: Package },
  { href: "/ops/unsold", label: "Unsold", icon: AlertCircle },
  { href: "/ops/offers", label: "Offers", icon: HandCoins },
  { href: "/ops/orders", label: "Orders", icon: Receipt },
  { href: "/ops/returns", label: "Returns", icon: Undo2 },
  { href: "/ops/customers", label: "Customers", icon: Users },
  { href: "/ops/settings", label: "Settings", icon: Settings },
];

export function OpsNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  if (orientation === "horizontal") {
    return (
      <nav className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = t.href === "/ops" ? pathname === "/ops" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-brand text-brand-fg" : "text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-0.5">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-brand text-brand-fg" : "text-muted hover:bg-bg hover:text-ink"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
