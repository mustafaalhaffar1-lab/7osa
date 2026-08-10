import {
  Banknote,
  TrendingUp,
  Package,
  Store,
  Wallet,
  Timer,
  Receipt,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { PayoutQueue, type QueuedPayout } from "./PayoutQueue";
import { MarkdownRunner } from "./MarkdownRunner";

export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  const supabase = await createClient();

  const [{ data: orders }, { data: items }, { data: wallets }, { data: payouts }, { data: payoutQueue }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, sale_price, commission_amount, seller_payout, status, created_at, items(title)")
        .order("created_at", { ascending: false }),
      supabase.from("items").select("id, status, list_price, sell_by, created_at, price_approval"),
      supabase.from("wallets").select("balance"),
      supabase.from("payouts").select("amount, status"),
      supabase
        .from("payouts")
        .select("id, amount, method, status, created_at, profiles(full_name)")
        .in("status", ["requested", "processing"])
        .order("created_at", { ascending: true }),
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

  // A number with no direction is just trivia. Compare the last 30 days to the 30 before.
  const now = Date.now();
  const DAY = 86_400_000;
  const inWindow = (iso: string, fromDaysAgo: number, toDaysAgo: number) => {
    const t = +new Date(iso);
    return t > now - fromDaysAgo * DAY && t <= now - toDaysAgo * DAY;
  };
  const sumSales = (from: number, to: number) =>
    validOrders.filter((o) => inWindow(o.created_at, from, to)).reduce((s, o) => s + Number(o.sale_price), 0);
  const gmv30 = sumSales(30, 0);
  const gmvPrev30 = sumSales(60, 30);
  const orders30 = validOrders.filter((o) => inWindow(o.created_at, 30, 0)).length;
  const ordersPrev30 = validOrders.filter((o) => inWindow(o.created_at, 60, 30)).length;
  const trend = (cur: number, prev: number): number | null =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : null;

  // Things that stall quietly. Each one is a real queue somebody has to clear.
  const staleQuotes = (items ?? []).filter(
    (i) => i.status === "estimated" && +new Date(i.created_at) < now - 3 * DAY
  ).length;
  const awaitingSeller = (items ?? []).filter((i) => i.price_approval === "pending").length;
  const toInspect = (byStatus.get("received") ?? 0) + (byStatus.get("collected") ?? 0);
  const toList = byStatus.get("inspected") ?? 0;
  const payoutsWaiting = (payoutQueue ?? []).length;

  const attention = [
    { count: toInspect, label: "waiting to be inspected", href: "/ops/receiving" },
    { count: toList, label: "checked, not yet listed", href: "/ops/receiving" },
    { count: awaitingSeller, label: "prices awaiting seller approval", href: "/ops/inventory/products" },
    { count: staleQuotes, label: "quotes older than 3 days", href: "/ops/inventory/products" },
    { count: payoutsWaiting, label: "payouts to process", href: "/ops" },
  ].filter((a) => a.count > 0);

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
        <Kpi
          icon={<Banknote size={16} />}
          label="GMV (all sales)"
          value={formatMoney(gmv)}
          trend={trend(gmv30, gmvPrev30)}
          trendLabel="vs prev 30d"
        />
        <Kpi icon={<Percent size={16} />} label={`${BRAND.name} commission`} value={formatMoney(commission)} accent />
        <Kpi icon={<Store size={16} />} label="Live listings" value={`${listed} · ${formatMoney(listedValue)}`} />
        <Kpi icon={<TrendingUp size={16} />} label="Sell-through" value={`${sellThrough}%`} />
        <Kpi icon={<Package size={16} />} label="In pipeline (pre-listing)" value={String(pipeline)} />
        <Kpi
          icon={<Receipt size={16} />}
          label="Orders"
          value={String(validOrders.length)}
          trend={trend(orders30, ordersPrev30)}
          trendLabel="vs prev 30d"
        />
        <Kpi icon={<Wallet size={16} />} label="Seller wallet liability" value={formatMoney(walletLiability)} />
        <Kpi icon={<Timer size={16} />} label="Pending payouts" value={formatMoney(pendingPayouts)} />
      </div>

      {attention.length > 0 && (
        <section className="mt-4 rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={15} className="text-accent" /> Needs attention
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {attention.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm transition-colors hover:border-accent"
              >
                <span className="font-bold text-accent">{a.count}</span>
                <span className="text-muted">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <MarkdownRunner
        due={
          (items ?? []).filter(
            (i) => i.status === "listed" && i.sell_by != null && new Date(i.sell_by) <= new Date()
          ).length
        }
      />

      <PayoutQueue
        payouts={((payoutQueue as { id: string; amount: number; method: string; status: string; created_at: string; profiles: { full_name: string | null } | null }[]) ?? []).map(
          (p): QueuedPayout => ({
            id: p.id,
            amount: Number(p.amount),
            method: p.method,
            status: p.status,
            created_at: p.created_at,
            seller: p.profiles?.full_name ?? null,
          })
        )}
      />

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
  trend,
  trendLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  trend?: number | null;
  trendLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${accent ? "bg-brand text-brand-fg" : "bg-brand/10 text-brand"}`}>
        {icon}
      </div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
      {trend != null && (
        <div
          className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium ${
            trend > 0
              ? "text-green-600 dark:text-green-400"
              : trend < 0
                ? "text-red-500"
                : "text-muted"
          }`}
        >
          {trend > 0 ? <ArrowUpRight size={11} /> : trend < 0 ? <ArrowDownRight size={11} /> : null}
          {trend > 0 ? "+" : ""}
          {trend}% <span className="font-normal text-muted">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
