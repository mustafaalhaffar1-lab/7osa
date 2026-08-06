"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { acceptOffer, declineOffer } from "../admin-actions";

export type AdminOffer = {
  id: string;
  amount: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  items: {
    title: string;
    list_price: number | null;
    seller_min_price: number | null;
    status: string;
    item_photos: { url: string }[] | null;
  } | null;
  profiles: { full_name: string | null } | null;
};

export function OfferRows({ offers }: { offers: AdminOffer[] }) {
  const pending = offers.filter((o) => o.status === "pending");
  const past = offers.filter((o) => o.status !== "pending");

  if (offers.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        No offers yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Awaiting decision ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Nothing waiting.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((o) => <Row key={o.id} offer={o} actionable />)}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">History</h2>
          <ul className="space-y-2">
            {past.map((o) => <Row key={o.id} offer={o} />)}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ offer, actionable }: { offer: AdminOffer; actionable?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const item = offer.items;
  const photo = item?.item_photos?.[0]?.url;
  const belowMin = item?.seller_min_price != null && offer.amount < Number(item.seller_min_price);
  const vsList =
    item?.list_price != null ? Math.round((1 - offer.amount / Number(item.list_price)) * 100) : null;
  const unavailable = item?.status !== "listed";

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
          <div className="truncate text-sm font-medium">{item?.title ?? "Item"}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{offer.profiles?.full_name ?? "Buyer"}</span>
            <span>· {new Date(offer.created_at).toLocaleDateString()}</span>
            {!actionable && <span className="capitalize">· {offer.status}</span>}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold">{formatMoney(offer.amount)}</div>
          <div className="text-[11px] text-muted">
            {item?.list_price != null ? `listed ${formatMoney(Number(item.list_price))}` : ""}
            {vsList != null && vsList > 0 ? ` · ${vsList}% below` : ""}
          </div>
        </div>

        {actionable && (
          <div className="flex items-center gap-2">
            <button
              disabled={pending || belowMin || unavailable}
              onClick={() => run(() => acceptOffer(offer.id))}
              title={belowMin ? "Below the seller's minimum" : unavailable ? "Item is no longer listed" : "Accept"}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Check size={13} /> Accept
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => declineOffer(offer.id))}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-40"
            >
              <X size={13} /> Decline
            </button>
          </div>
        )}
      </div>

      {actionable && belowMin && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle size={12} /> Below the seller&apos;s minimum of{" "}
          {formatMoney(Number(item?.seller_min_price))} — cannot accept.
        </p>
      )}
      {actionable && !belowMin && unavailable && (
        <p className="mt-2 text-xs text-muted">Item is no longer listed.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
