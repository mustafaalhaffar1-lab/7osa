"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/domain/enums";
import { setOrderStatus } from "../admin-actions";

export type AdminOrder = {
  id: string;
  sale_price: number;
  commission_amount: number;
  seller_payout: number;
  status: OrderStatus;
  payment_method: string | null;
  created_at: string;
  items: { title: string; item_photos: { url: string }[] | null } | null;
};

/** The forward path an order takes; refund/cancel are deliberate side exits. */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "paid",
  paid: "fulfilling",
  fulfilling: "delivered",
  delivered: "completed",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Mark paid",
  paid: "Start delivery",
  fulfilling: "Mark delivered",
  delivered: "Complete",
};

export function OrderRows({ orders }: { orders: AdminOrder[] }) {
  if (orders.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        No orders yet.
      </p>
    );
  }
  return (
    <ul className="mt-4 space-y-2">
      {orders.map((o) => (
        <Row key={o.id} order={o} />
      ))}
    </ul>
  );
}

function Row({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const photo = order.items?.item_photos?.[0]?.url;
  const next = NEXT[order.status];

  function advance(to: OrderStatus) {
    setError(null);
    start(async () => {
      const res = await setOrderStatus(order.id, to);
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
          <div className="truncate text-sm font-medium">{order.items?.title ?? "Item"}</div>
          <div className="mt-0.5 text-xs text-muted">
            {new Date(order.created_at).toLocaleString()} · {order.payment_method ?? "—"} ·{" "}
            <span className="font-medium capitalize text-ink">{order.status}</span>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{formatMoney(order.sale_price)}</div>
          <div className="text-xs text-muted">
            us {formatMoney(order.commission_amount)} · seller {formatMoney(order.seller_payout)}
          </div>
        </div>
        {next && (
          <button
            disabled={pending}
            onClick={() => advance(next)}
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "…" : NEXT_LABEL[order.status]}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
