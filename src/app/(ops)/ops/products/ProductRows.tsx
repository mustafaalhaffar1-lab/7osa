"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, QrCode } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/domain/item-state";
import { setItemPrice, overrideItemStatus } from "../admin-actions";

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

/** Once an item sells (or otherwise leaves the working pipeline) it's archived out of the
 * default list. Active = the pre-sale pipeline + live listings. */
const ARCHIVED: ReadonlySet<string> = new Set([
  "sold",
  "collection_scheduled",
  "in_transit",
  "delivered",
  "completed",
  "returned",
  "withdrawn",
  "declined",
  "unsold_expired",
]);

export function ProductRows({ items }: { items: AdminItem[] }) {
  const [filter, setFilter] = useState<string>(""); // "" = active, "archived", or a status

  const active = items.filter((i) => !ARCHIVED.has(i.status));
  const archived = items.filter((i) => ARCHIVED.has(i.status));
  const activeStatuses = [...new Set(active.map((i) => i.status))];

  const filtered =
    filter === ""
      ? active
      : filter === "archived"
        ? archived
        : items.filter((i) => i.status === filter);

  return (
    <div className="mt-4">
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
        <Chip label={`Archived (${archived.length})`} active={filter === "archived"} onClick={() => setFilter("archived")} archived />
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((item) => (
          <Row key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Nothing here.
          </li>
        )}
      </ul>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  archived,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  archived?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${
        active
          ? "bg-brand text-brand-fg"
          : archived
            ? "border border-border bg-surface text-muted hover:text-ink"
            : "border border-border bg-surface text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ item }: { item: AdminItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState(item.list_price != null ? String(item.list_price) : "");
  const photo = item.item_photos?.[0]?.url;
  const m = Array.isArray(item.item_metrics) ? item.item_metrics[0] : item.item_metrics;

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1 basis-48">
          <div className="truncate text-sm font-medium">
            {item.brand ? `${item.brand} · ` : ""}
            {item.title}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.sku && <span className="font-mono text-[11px] text-ink/70">{item.sku}</span>}
            <span className="capitalize">{item.status.replace(/_/g, " ")}</span>
            <span>·</span>
            <span>{item.possession === "warehouse" ? "Warehouse" : "In place"}</span>
            {m && m.views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye size={11} /> {m.views}
              </span>
            )}
            {m && m.saves > 0 && (
              <span className="inline-flex items-center gap-1">
                <Heart size={11} /> {m.saves}
              </span>
            )}
          </div>
        </div>

        {/* Print label */}
        <Link
          href={`/label/${item.id}`}
          title="Print barcode label"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand"
        >
          <QrCode size={13} /> Label
        </Link>

        {/* Reprice */}
        <div className="flex items-center gap-1.5">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            className="w-24 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand"
            placeholder="Price"
          />
          <button
            disabled={pending || !price || parseFloat(price) === item.list_price}
            onClick={() => run(() => setItemPrice(item.id, parseFloat(price)))}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            Reprice
          </button>
        </div>

        {/* Status override */}
        <select
          disabled={pending}
          value={item.status}
          onChange={(e) => run(() => overrideItemStatus(item.id, e.target.value as ItemStatus))}
          className="rounded-lg border border-border bg-bg px-2 py-1.5 text-xs capitalize outline-none focus:border-brand"
        >
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <div className="text-right text-sm font-semibold">
          {item.list_price != null ? formatMoney(item.list_price) : "—"}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
