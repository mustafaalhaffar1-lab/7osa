"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { processPayout } from "./admin-actions";

export type QueuedPayout = {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  seller: string | null;
};

export function PayoutQueue({ payouts }: { payouts: QueuedPayout[] }) {
  if (payouts.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-muted">Payouts to process</h2>
      <ul className="mt-3 space-y-2">
        {payouts.map((p) => (
          <Row key={p.id} payout={p} />
        ))}
      </ul>
    </section>
  );
}

function Row({ payout }: { payout: QueuedPayout }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(status: "paid" | "failed") {
    setError(null);
    start(async () => {
      const res = await processPayout(payout.id, status);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium">{payout.seller ?? "Seller"}</div>
          <div className="text-xs text-muted">
            {new Date(payout.created_at).toLocaleDateString()} · to {payout.method} · {payout.status}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatMoney(payout.amount)}</span>
          <button
            disabled={pending}
            onClick={() => act("paid")}
            className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Mark paid
          </button>
          <button
            disabled={pending}
            onClick={() => act("failed")}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
          >
            Fail
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
