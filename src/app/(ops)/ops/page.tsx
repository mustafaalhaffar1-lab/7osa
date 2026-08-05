import {
  Banknote,
  TrendingUp,
  Package,
  Store,
  Wallet,
  Timer,
  Receipt,
  Percent,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  const supabase = await createClient();

  const [{ data: orders }, { data: items }, { data: wallets }, { data: payouts }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, sale_price, commission_amount, seller_payout, status, created_at, items(title)")
        .order("created_at", { ascending: false }),
      supabase.from("items").select("id, status, list_price"),
      supabase.from("wallets").select("balance"),
      supabase.from("payouts").select("amount, status"),
    ]);

  const validOrders = (orders ?? []).filter((o) => !["cancelled", "refunded"].includes(o.status));
  const gmv = validOrders.reduce((s, o) => s + Number(o.sale_price), 0);
  const commission = validOrders.reduce((s, o) => s + Number(o.commission_amount), 0);
  const walletLiability = (wallets ?? []).reduce((s, w) => s + Number(w.balance), 0);
  const pendingPayouts = (payouts ?? [])
    .filter((p) => p.status === "requested" || p.status === "processing")
    .reduce((s, p) => s + Number(p.amount), 0);

  const byStatus = new Map<string, number>();
  for (const it of items ?? []) byStatus.set(it.status, (byStatus.get(it.status) ?? 0) + 1);
  const listed = byStatus.get("listed") ?? 0;
  const soldish = ["sold", "in_transit", "delivered", "completed"].reduce(
    (s, k) => s + (byStatus.get(k) ?? 0),
    0
  );
  const pipeline = ["accepted", "pickup_scheduled", "collected", "received", "inspected"].reduce(
    (s, k) => s + (byStatus.get(k) ?? 0),
    0
  );
  const sellThrough = listed + soldish > 0 ? Math.round((soldish / (listed + soldish)) * 100) : 0;
  const listedValue = (items ?? [])
    .filter((i) => i.status === "listed")
    .reduce((s, i) => s + Number(i.list_price ?? 0), 0);

  const ORDER_LABEL: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    fulfilling: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Business at a glance</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Banknote size={16} />} label="GMV (all sales)" value={formatMoney(gmv)} />
        <Kpi icon={<Percent size={16} />} label={`${BRAND.name} commission`} value={formatMoney(commission)} accent />
        <Kpi icon={<Store size={16} />} label="Live listings" value={`${listed} · ${formatMoney(listedValue)}`} />
        <Kpi icon={<TrendingUp size={16} />} label="Sell-through" value={`${sellThrough}%`} />
        <Kpi icon={<Package size={16} />} label="In pipeline (pre-listing)" value={String(pipeline)} />
        <Kpi icon={<Receipt size={16} />} label="Orders" value={String(validOrders.length)} />
        <Kpi icon={<Wallet size={16} />} label="Seller wallet liability" value={formatMoney(walletLiability)} />
        <Kpi icon={<Timer size={16} />} label="Pending payouts" value={formatMoney(pendingPayouts)} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-muted">Recent orders</h2>
      {!orders?.length ? (
        <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          No orders yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {orders.slice(0, 8).map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {(o.items as { title: string } | null)?.title ?? "Item"}
                </div>
                <div className="text-xs text-muted">
                  {new Date(o.created_at).toLocaleString(BRAND.locale)} · {ORDER_LABEL[o.status] ?? o.status}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold">{formatMoney(Number(o.sale_price))}</div>
                <div className="text-xs text-muted">
                  us {formatMoney(Number(o.commission_amount))} · seller {formatMoney(Number(o.seller_payout))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${accent ? "bg-brand text-brand-fg" : "bg-brand/10 text-brand"}`}>
        {icon}
      </div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}
