"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/domain/item-state";
import { setItemPrice, overrideItemStatus } from "../../../admin-actions";

export function ProductActions({
  itemId,
  status,
  currentPrice,
}: {
  itemId: string;
  status: string;
  currentPrice: number | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [price, setPrice] = useState(currentPrice != null ? String(currentPrice) : "");

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setNotice(ok);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold">Manage</h2>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Set price (AED)</span>
          <div className="flex items-center gap-1.5">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              className="w-28 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button
              disabled={pending || !price || parseFloat(price) === currentPrice}
              onClick={() => run(() => setItemPrice(itemId, parseFloat(price)), `Repriced to ${formatMoney(parseFloat(price))}.`)}
              className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Reprice
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-muted">Status</span>
          <select
            disabled={pending}
            value={status}
            onChange={(e) => run(() => overrideItemStatus(itemId, e.target.value as ItemStatus), "Status updated.")}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm capitalize outline-none focus:border-brand"
          >
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {notice && <p className="mt-2 text-xs text-brand">{notice}</p>}
    </div>
  );
}
