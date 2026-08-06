"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";

export type DirectoryUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  balance: number;
  items_count: number;
  orders_count: number;
  roles: string[];
};

type Tab = "all" | "sellers" | "buyers" | "staff";

export function CustomerDirectory({ users }: { users: DirectoryUser[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (tab === "sellers" && u.items_count === 0) return false;
      if (tab === "buyers" && u.orders_count === 0) return false;
      if (tab === "staff" && u.roles.length === 0) return false;
      if (!needle) return true;
      return (
        (u.full_name ?? "").toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
      );
    });
  }, [users, q, tab]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    { key: "sellers", label: "Sellers", count: users.filter((u) => u.items_count > 0).length },
    { key: "buyers", label: "Buyers", count: users.filter((u) => u.orders_count > 0).length },
    { key: "staff", label: "Staff", count: users.filter((u) => u.roles.length > 0).length },
  ];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="flex gap-1 text-xs">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                tab === t.key ? "bg-brand text-brand-fg" : "border border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {filtered.map((u) => (
          <li key={u.id}>
            <Link href={`/ops/customers/${u.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-bg">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {(u.full_name || u.email)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{u.full_name || "—"}</span>
                  {u.roles.length > 0 && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                      Staff
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted">{u.email}</div>
              </div>
              <div className="hidden gap-5 text-xs text-muted sm:flex">
                <Stat value={String(u.items_count)} label="listed" />
                <Stat value={String(u.orders_count)} label="bought" />
                <Stat value={formatMoney(u.balance)} label="wallet" />
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted">No customers match.</li>
        )}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="text-right">
      <span className="block font-semibold text-ink">{value}</span>
      <span className="block text-[10px] uppercase tracking-wide">{label}</span>
    </span>
  );
}
