"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Settings2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { ITEM_STATUSES, nextStates, type ItemStatus, type PossessionMode } from "@/lib/domain/item-state";
import { setItemPrice, overrideItemStatus } from "../../../admin-actions";
import { opsList } from "../../../actions";

/** Plain-English name for the button that moves an item forward one step. */
const ADVANCE_LABEL: Partial<Record<ItemStatus, string>> = {
  estimated: "Mark quoted",
  accepted: "Accept it",
  pickup_scheduled: "Book the pickup",
  collected: "Mark collected",
  received: "Book in at the studio",
  inspected: "Mark inspected",
  listed: "Put it on sale",
  reserved: "Reserve it",
  sold: "Mark sold",
  collection_scheduled: "Schedule collection",
  in_transit: "Mark on its way",
  delivered: "Mark delivered",
  completed: "Complete it",
  returned: "Mark returned",
  unsold_expired: "Mark unsold",
  withdrawn: "Withdraw it",
  declined: "Decline it",
};

export function ProductActions({
  itemId,
  status,
  possession,
  currentPrice,
}: {
  itemId: string;
  status: string;
  possession: PossessionMode;
  currentPrice: number | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [price, setPrice] = useState(currentPrice != null ? String(currentPrice) : "");
  const [override, setOverride] = useState(false);

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

  // Only the moves the state machine actually allows from here.
  const forward = nextStates(possession, status as ItemStatus);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold">Manage</h2>

      {/* Move it along — the normal path, one tap, no dropdown */}
      {forward.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-xs text-muted">Next step</div>
          <div className="flex flex-wrap gap-2">
            {forward.map((to) => {
              // Listing needs a price, so it routes through ops_list_item, not a bare status flip.
              const isListing = to === "listed";
              const disabled = pending || (isListing && !(parseFloat(price) > 0));
              return (
                <button
                  key={to}
                  disabled={disabled}
                  onClick={() =>
                    run(
                      () => (isListing ? opsList(itemId, parseFloat(price)) : overrideItemStatus(itemId, to)),
                      isListing ? "Listed." : `Moved to ${to.replace(/_/g, " ")}.`
                    )
                  }
                  title={isListing && !(parseFloat(price) > 0) ? "Set a price first" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-opacity disabled:opacity-40 ${
                    to === "declined" || to === "withdrawn"
                      ? "border border-border text-muted hover:border-red-500 hover:text-red-500"
                      : "bg-brand text-brand-fg hover:opacity-90"
                  }`}
                >
                  {ADVANCE_LABEL[to] ?? to.replace(/_/g, " ")}
                  {to !== "declined" && to !== "withdrawn" && <ChevronRight size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-border pt-4">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">
            {status === "listed" ? "Set price (AED)" : "List price (AED)"}
          </span>
          <div className="flex items-center gap-1.5">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              className="w-28 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button
              disabled={pending || !price || parseFloat(price) === currentPrice}
              onClick={() =>
                run(() => setItemPrice(itemId, parseFloat(price)), `Repriced to ${formatMoney(parseFloat(price))}.`)
              }
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
            >
              Reprice
            </button>
          </div>
        </label>

        {/* The escape hatch, deliberately behind a click so it isn't the default path */}
        <div>
          <button
            onClick={() => setOverride((o) => !o)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <Settings2 size={12} /> {override ? "Hide" : "Force"} status
          </button>
          {override && (
            <select
              disabled={pending}
              value={status}
              onChange={(e) => run(() => overrideItemStatus(itemId, e.target.value as ItemStatus), "Status forced.")}
              className="ml-2 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm capitalize outline-none focus:border-brand"
            >
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {notice && <p className="mt-2 text-xs text-brand">{notice}</p>}
    </div>
  );
}
