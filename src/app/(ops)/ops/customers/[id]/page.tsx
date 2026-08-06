import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(BRAND.locale, { day: "numeric", month: "short", year: "numeric" });

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase.rpc("ops_get_customer", { p_user_id: id });
  const customer = (rows as { id: string; email: string; full_name: string | null; phone: string | null; created_at: string; balance: number; roles: string[] }[] | null)?.[0];
  if (!customer) notFound();

  const [{ data: listings }, { data: sales }, { data: purchases }, { data: txns }, { data: payouts }, { data: offers }] =
    await Promise.all([
      supabase
        .from("items")
        .select("id, title, status, list_price, created_at, item_photos(url)")
        .eq("seller_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, sale_price, seller_payout, status, created_at, items!inner(title, seller_id)")
        .eq("items.seller_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, sale_price, status, created_at, items(title)")
        .eq("buyer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("wallet_transactions")
        .select("id, amount, type, memo, balance_after, created_at, wallets!inner(user_id)")
        .eq("wallets.user_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("payouts").select("id, amount, method, status, created_at").eq("seller_id", id).order("created_at", { ascending: false }),
      supabase
        .from("offers")
        .select("id, amount, status, created_at, items(title)")
        .eq("buyer_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const earned = (txns ?? []).filter((t) => t.type === "sale_credit").reduce((s, t) => s + Number(t.amount), 0);
  const spent = (purchases ?? []).reduce((s, o) => s + Number(o.sale_price), 0);
  const soldCount = (sales ?? []).filter((o) => !["cancelled", "refunded"].includes(o.status)).length;

  return (
    <div>
      <Link href="/ops/customers" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft size={15} /> All customers
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-brand-fg">
            {(customer.full_name || customer.email)[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{customer.full_name || "Unnamed customer"}</h1>
              {customer.roles.map((r) => (
                <span key={r} className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {customer.email}</span>
              {customer.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {customer.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Joined {fmtDate(customer.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi icon={<Wallet size={15} />} label="Wallet balance" value={formatMoney(Number(customer.balance))} accent />
          <Kpi icon={<TrendingUp size={15} />} label="Earned all-time" value={formatMoney(earned)} />
          <Kpi icon={<Package size={15} />} label="Items sold" value={`${soldCount} / ${listings?.length ?? 0}`} />
          <Kpi icon={<ShoppingBag size={15} />} label="Total spent" value={formatMoney(spent)} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Listings */}
        <Panel title="Listings" count={listings?.length ?? 0}>
          {(listings ?? []).map((it) => (
            <RowLink key={it.id} href={`/shop/${it.id}`} title={it.title} sub={`${it.status.replace(/_/g, " ")} · ${fmtDate(it.created_at)}`} right={it.list_price != null ? formatMoney(Number(it.list_price)) : "—"} img={(it.item_photos as { url: string }[] | null)?.[0]?.url} />
          ))}
        </Panel>

        {/* Sales */}
        <Panel title="Sales (as seller)" count={sales?.length ?? 0}>
          {(sales ?? []).map((o) => (
            <Row key={o.id} title={(o.items as { title: string } | null)?.title ?? "Item"} sub={`${o.status} · ${fmtDate(o.created_at)}`} right={`+${formatMoney(Number(o.seller_payout))}`} rightMuted={`sold ${formatMoney(Number(o.sale_price))}`} />
          ))}
        </Panel>

        {/* Purchases */}
        <Panel title="Purchases (as buyer)" count={purchases?.length ?? 0}>
          {(purchases ?? []).map((o) => (
            <Row key={o.id} title={(o.items as { title: string } | null)?.title ?? "Item"} sub={`${o.status} · ${fmtDate(o.created_at)}`} right={formatMoney(Number(o.sale_price))} />
          ))}
        </Panel>

        {/* Wallet ledger */}
        <Panel title="Wallet activity" count={txns?.length ?? 0}>
          {(txns ?? []).map((t) => {
            const pos = Number(t.amount) >= 0;
            return (
              <Row
                key={t.id}
                title={(t.memo as string) || (t.type as string)}
                sub={fmtDate(t.created_at as string)}
                right={`${pos ? "+" : "−"}${formatMoney(Math.abs(Number(t.amount)))}`}
                rightMuted={`bal ${formatMoney(Number(t.balance_after))}`}
                rightClass={pos ? "text-green-600 dark:text-green-400" : ""}
              />
            );
          })}
        </Panel>

        {/* Payouts */}
        <Panel title="Withdrawals" count={payouts?.length ?? 0}>
          {(payouts ?? []).map((p) => (
            <Row key={p.id} title={`To ${p.method}`} sub={`${p.status} · ${fmtDate(p.created_at)}`} right={formatMoney(Number(p.amount))} />
          ))}
        </Panel>

        {/* Offers */}
        <Panel title="Offers made" count={offers?.length ?? 0}>
          {(offers ?? []).map((o) => (
            <Row key={o.id} title={(o.items as { title: string } | null)?.title ?? "Item"} sub={`${o.status} · ${fmtDate(o.created_at)}`} right={formatMoney(Number(o.amount))} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      <div className={`mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${accent ? "bg-brand text-brand-fg" : "bg-brand/10 text-brand"}`}>
        {icon}
      </div>
      <div className="text-base font-bold leading-tight">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const isEmpty = count === 0;
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">{count}</span>
      </div>
      {isEmpty ? (
        <p className="px-4 py-6 text-center text-sm text-muted">Nothing here.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">{items}</ul>
      )}
    </section>
  );
}

function Row({
  title,
  sub,
  right,
  rightMuted,
  rightClass = "",
}: {
  title: string;
  sub: string;
  right: string;
  rightMuted?: string;
  rightClass?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium">{title}</div>
        <div className="truncate text-xs capitalize text-muted">{sub}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`font-semibold ${rightClass}`}>{right}</div>
        {rightMuted && <div className="text-[11px] text-muted">{rightMuted}</div>}
      </div>
    </li>
  );
}

function RowLink({
  href,
  title,
  sub,
  right,
  img,
}: {
  href: string;
  title: string;
  sub: string;
  right: string;
  img?: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-bg">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-bg">
            {img && /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{title}</div>
            <div className="truncate text-xs capitalize text-muted">{sub}</div>
          </div>
        </div>
        <div className="shrink-0 font-semibold">{right}</div>
      </Link>
    </li>
  );
}
