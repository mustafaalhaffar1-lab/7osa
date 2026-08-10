"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

/**
 * Shown when our pricing team wants to list below the seller's floor (or below
 * the quoted estimate). Listing at a price the seller never agreed to is how you
 * lose a seller permanently — so we ask, and we say why.
 */
export function PriceApproval({
  itemId,
  proposed,
  estimateMin,
  sellerMin,
  proposedAt,
}: {
  itemId: string;
  proposed: number;
  estimateMin: number | null;
  sellerMin: number | null;
  proposedAt: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const daysWaiting = proposedAt
    ? Math.floor((Date.now() - +new Date(proposedAt)) / 86_400_000)
    : 0;

  function decide(approve: boolean) {
    setError(null);
    start(async () => {
      const { error } = await createClient().rpc("seller_decide_price", {
        p_item_id: itemId,
        p_approve: approve,
      });
      if (error) setError(error.message);
      else router.refresh();
    });
  }

  const reference = sellerMin ?? estimateMin;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3.5">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">We&apos;d like to list this at {formatMoney(proposed)}</div>
          <p className="mt-0.5 text-xs text-muted">
            {reference != null
              ? `That's below the ${sellerMin != null ? "minimum you set" : "estimate we gave you"} of ${formatMoney(reference)}. `
              : ""}
            Based on what similar items are actually selling for, this is the price we think will move it.
            Nothing goes live until you say yes.
          </p>
          {daysWaiting >= 3 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Waiting {daysWaiting} days — we&apos;ll approve it automatically after 7 so it doesn&apos;t sit idle.
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              onClick={() => decide(true)}
              disabled={pending}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "…" : `List it at ${formatMoney(proposed)}`}
            </button>
            <button
              onClick={() => decide(false)}
              disabled={pending}
              className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium transition-colors hover:border-ink disabled:opacity-50"
            >
              No — keep my price
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
