"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PackageCheck,
  QrCode,
  ArrowRight,
  Truck,
  ClipboardCheck,
  Tag,
  Camera,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { opsSetStatus, opsList } from "../actions";

export type ReceivingItem = {
  id: string;
  sku: string | null;
  title: string;
  brand: string | null;
  status: string;
  list_price: number | null;
  ai_estimate_min: number | null;
  ai_estimate_max: number | null;
  description: string | null;
  shelf_code: string | null;
  photo: string | null;
  photoCount: number;
  inspected: boolean;
};

/** What still needs doing before this can go on sale. */
function steps(it: ReceivingItem) {
  return [
    { label: "Inspect", done: it.inspected, icon: ClipboardCheck },
    { label: "Photos", done: it.photoCount > 1, icon: Camera },
    { label: "Shelf", done: Boolean(it.shelf_code), icon: MapPin },
    { label: "Price", done: it.list_price != null, icon: Tag },
  ];
}

export function BatchReceiveButton({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (ids.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            for (const id of ids) {
              const res = await opsSetStatus(id, "received");
              if (res?.error) {
                setError(res.error);
                break;
              }
            }
            router.refresh();
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <PackageCheck size={13} />
        {pending ? "Booking in…" : `Book in all ${ids.length}`}
      </button>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}

export function ReceivingRow({ item }: { item: ReceivingItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState(false);
  const [price, setPrice] = useState(
    item.list_price != null
      ? String(item.list_price)
      : item.ai_estimate_min != null && item.ai_estimate_max != null
        ? String(Math.round((Number(item.ai_estimate_min) + Number(item.ai_estimate_max)) / 2))
        : ""
  );

  const checklist = steps(item);
  const remaining = checklist.filter((s) => !s.done).length;
  const inVan = item.status === "collected";

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setPricing(false);
        router.refresh();
      }
    });
  }

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <Link href={`/ops/inventory/products/${item.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
          {item.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photo} alt="" className="h-full w-full object-cover" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/ops/inventory/products/${item.id}`} className="block">
            <div className="truncate text-sm font-medium hover:text-brand">
              {item.brand ? `${item.brand} · ` : ""}
              {item.title}
            </div>
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.sku && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand">
                <QrCode size={10} /> {item.sku}
              </span>
            )}
            {item.ai_estimate_min != null && item.ai_estimate_max != null && (
              <span>
                est. {formatMoney(Number(item.ai_estimate_min))} – {formatMoney(Number(item.ai_estimate_max))}
              </span>
            )}
            {item.shelf_code && <span>shelf {item.shelf_code}</span>}
          </div>
          {item.description && (
            <p className="mt-1 truncate text-xs italic text-muted">“{item.description}”</p>
          )}

          {/* Checklist doubles as navigation — each unfinished step opens where you fix it. */}
          {!inVan && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {checklist.map((s) => (
                <Link
                  key={s.label}
                  href={`/ops/inventory/products/${item.id}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    s.done
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "border border-border text-muted hover:border-brand hover:text-brand"
                  }`}
                >
                  <s.icon size={9} />
                  {s.done ? "✓ " : ""}
                  {s.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* One primary action, matched to where the item actually is. */}
        <div className="shrink-0 text-right">
          {inVan ? (
            <button
              disabled={pending}
              onClick={() => run(() => opsSetStatus(item.id, "received"))}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <PackageCheck size={13} /> {pending ? "…" : "Book in"}
            </button>
          ) : !item.inspected ? (
            <Link
              href={`/ops/inventory/products/${item.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
            >
              <ClipboardCheck size={13} /> Inspect
            </Link>
          ) : !pricing ? (
            <button
              onClick={() => setPricing(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90"
            >
              <Tag size={13} /> Price &amp; list
            </button>
          ) : null}

          {!inVan && !pricing && (
            <div className="mt-1 text-[11px] text-muted">
              {remaining === 0 ? "Ready to list" : `${remaining} step${remaining === 1 ? "" : "s"} left`}
            </div>
          )}
          {inVan && <div className="mt-1 text-[11px] text-muted">In the van</div>}
        </div>

        {!inVan && !pricing && (
          <Link href={`/ops/inventory/products/${item.id}`} className="shrink-0 text-muted hover:text-brand">
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Listing happens right here — walking to another screen is how items sit unsold. */}
      {pricing && (
        <div className="mt-3 rounded-xl border border-brand/40 bg-brand/5 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-muted">List price</span>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-bg px-2.5 py-1.5">
                <span className="text-[11px] text-muted">AED</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="numeric"
                  autoFocus
                  className="w-24 bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <button
              disabled={pending || !price || !(parseFloat(price) > 0)}
              onClick={() => run(() => opsList(item.id, parseFloat(price)))}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Listing…" : "Put it on sale"}
            </button>
            <button
              onClick={() => setPricing(false)}
              className="rounded-full border border-border px-3 py-2 text-xs font-medium text-muted"
            >
              Cancel
            </button>
          </div>

          {item.photoCount <= 1 && (
            <p className="mt-2 inline-flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              Only {item.photoCount} photo — listings with one photo sell far slower.
            </p>
          )}
          {item.ai_estimate_min != null && parseFloat(price) < Number(item.ai_estimate_min) && (
            <p className="mt-1 text-[11px] text-muted">
              Below the {formatMoney(Number(item.ai_estimate_min))} we quoted — the seller will be asked
              to approve before it goes live.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
    </li>
  );
}

export function VanBanner({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
      <Truck size={13} className="shrink-0" />
      {count} item{count === 1 ? "" : "s"} collected but not booked in yet — book them in when they
      physically reach the studio.
    </div>
  );
}
