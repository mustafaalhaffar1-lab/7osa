"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, QrCode, ScanLine, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { ItemStatus } from "@/lib/domain/item-state";

export type AdminItem = {
  id: string;
  sku: string | null;
  title: string;
  brand: string | null;
  status: ItemStatus;
  possession: "warehouse" | "in_place";
  condition_grade: string | null;
  list_price: number | null;
  ai_estimate_min: number | null;
  ai_estimate_max: number | null;
  created_at: string;
  item_photos: { url: string }[] | null;
  item_metrics: { views: number; saves: number } | { views: number; saves: number }[] | null;
};

/** Once an item sells (or leaves the working pipeline) it's archived out of the default list. */
const ARCHIVED: ReadonlySet<string> = new Set([
  "sold", "collection_scheduled", "in_transit", "delivered", "completed",
  "returned", "withdrawn", "declined", "unsold_expired",
]);

export function ProductRows({ items }: { items: AdminItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>(""); // "" = active, "archived", or a status
  const [q, setQ] = useState("");

  const active = items.filter((i) => !ARCHIVED.has(i.status));
  const archived = items.filter((i) => ARCHIVED.has(i.status));
  const activeStatuses = [...new Set(active.map((i) => i.status))];

  const base =
    filter === "" ? active : filter === "archived" ? archived : items.filter((i) => i.status === filter);

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      needle
        ? base.filter(
            (i) =>
              (i.sku ?? "").toLowerCase().includes(needle) ||
              i.title.toLowerCase().includes(needle) ||
              (i.brand ?? "").toLowerCase().includes(needle)
          )
        : base,
    [base, needle]
  );

  // Handheld barcode scanners type the SKU then press Enter — jump straight to the item.
  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const exact = items.find((i) => (i.sku ?? "").toLowerCase() === needle);
    if (exact) {
      setQ("");
      router.push(`/ops/products/${exact.id}`);
    }
  }

  return (
    <div className="mt-4">
      {/* Scan / search */}
      <form onSubmit={onSearchSubmit} className="relative mb-3">
        <ScanLine size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Scan a barcode or search by SKU, title, brand…"
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
        />
      </form>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <Chip label={`Active (${active.length})`} active={!filter} onClick={() => setFilter("")} />
        {activeStatuses.map((s) => (
          <Chip
            key={s}
            label={`${s.replace(/_/g, " ")} (${active.filter((i) => i.status === s).length})`}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
        <Chip label={`Archived (${archived.length})`} active={filter === "archived"} onClick={() => setFilter("archived")} />
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((item) => (
          <Row key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            {needle ? "No item matches that code or search." : "Nothing here."}
          </li>
        )}
      </ul>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${
        active ? "bg-brand text-brand-fg" : "border border-border bg-surface text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ item }: { item: AdminItem }) {
  const photo = item.item_photos?.[0]?.url;
  const m = Array.isArray(item.item_metrics) ? item.item_metrics[0] : item.item_metrics;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-brand/40">
      <Link href={`/ops/products/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {item.brand ? `${item.brand} · ` : ""}
            {item.title}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.sku && <span className="font-mono text-[11px] text-brand">{item.sku}</span>}
            <span className="capitalize">{item.status.replace(/_/g, " ")}</span>
            <span>· {item.possession === "warehouse" ? "Warehouse" : "In place"}</span>
            {m && m.views > 0 && (
              <span className="inline-flex items-center gap-1"><Eye size={11} /> {m.views}</span>
            )}
            {m && m.saves > 0 && (
              <span className="inline-flex items-center gap-1"><Heart size={11} /> {m.saves}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right text-sm font-semibold">
          {item.list_price != null ? formatMoney(item.list_price) : "—"}
        </div>
      </Link>

      <Link
        href={`/label/${item.id}`}
        title="Print barcode label"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand"
      >
        <QrCode size={13} /> Label
      </Link>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </li>
  );
}
