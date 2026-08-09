"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ShieldAlert, Lock, AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { resolveReturn } from "../admin-actions";

export type AdminReturn = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  refund_amount: number | null;
  resolution_note: string | null;
  created_at: string;
  orders: {
    sale_price: number;
    seller_payout: number;
    payout_status: string;
    fulfilment: string;
    delivered_at: string | null;
    items: { title: string; sku: string | null; item_photos: { url: string }[] | null } | null;
  } | null;
  profiles: { full_name: string | null } | null;
};

const REASON_LABEL: Record<string, string> = {
  damaged_in_delivery: "Damaged during delivery",
  not_as_described: "Not as described",
  missing_parts: "Missing parts",
  faulty: "Doesn't work",
  other: "Other",
};

export function ReturnRows({ returns }: { returns: AdminReturn[] }) {
  const open = returns.filter((r) => r.status === "requested");
  const past = returns.filter((r) => r.status !== "requested");

  if (returns.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        No returns — nothing to review.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Awaiting decision ({open.length})</h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Nothing waiting.
          </p>
        ) : (
          <ul className="space-y-3">{open.map((r) => <Row key={r.id} ret={r} actionable />)}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">History</h2>
          <ul className="space-y-2">{past.map((r) => <Row key={r.id} ret={r} />)}</ul>
        </section>
      )}
    </div>
  );
}

function Row({ ret, actionable }: { ret: AdminReturn; actionable?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState(
    ret.orders?.sale_price != null ? String(ret.orders.sale_price) : ""
  );

  const order = ret.orders;
  const item = order?.items;
  const photo = item?.item_photos?.[0]?.url;
  const alreadyPaid = order?.payout_status === "released";

  function act(approve: boolean) {
    setError(null);
    start(async () => {
      const res = await resolveReturn(ret.id, approve, approve ? parseFloat(refund) : null, note);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1 basis-56">
          <div className="truncate text-sm font-medium">{item?.title ?? "Item"}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item?.sku && <span className="font-mono text-[11px] text-brand">{item.sku}</span>}
            <span>{ret.profiles?.full_name ?? "Buyer"}</span>
            <span>· {new Date(ret.created_at).toLocaleDateString()}</span>
            {!actionable && <span className="capitalize">· {ret.status}</span>}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <ShieldAlert size={12} /> {REASON_LABEL[ret.reason] ?? ret.reason}
          </div>
          {ret.description && <p className="mt-1.5 text-xs italic text-muted">“{ret.description}”</p>}
          {ret.resolution_note && (
            <p className="mt-1.5 text-xs text-muted">Note: {ret.resolution_note}</p>
          )}
        </div>

        <div className="text-right text-sm">
          <div className="font-bold">{order ? formatMoney(order.sale_price) : "—"}</div>
          <div className="mt-0.5 text-[11px] text-muted">
            seller {order ? formatMoney(order.seller_payout) : "—"}
          </div>
          <div
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              alreadyPaid ? "bg-red-500/10 text-red-500" : "bg-brand/10 text-brand"
            }`}
          >
            <Lock size={10} /> payout {order?.payout_status}
          </div>
        </div>
      </div>

      {actionable && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {alreadyPaid && (
            <p className="inline-flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle size={12} /> The seller has already been paid — approving will claw
              back {order ? formatMoney(order.seller_payout) : ""} from their wallet.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Refund the buyer (AED)</span>
              <input
                value={refund}
                onChange={(e) => setRefund(e.target.value)}
                inputMode="numeric"
                className="w-28 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block flex-1 basis-48">
              <span className="mb-1 block text-xs text-muted">Note (what you decided and why)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-brand"
              />
            </label>
            <button
              disabled={pending}
              onClick={() => act(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Check size={13} /> Approve refund
            </button>
            <button
              disabled={pending}
              onClick={() => act(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-40"
            >
              <X size={13} /> Decline
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
