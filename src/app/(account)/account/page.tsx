import Link from "next/link";
import {
  Wallet,
  Tag,
  ShoppingBag,
  CalendarCheck,
  ArrowRight,
  Camera,
  Clock,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function AccountOverview() {
  const user = await getUser();
  const supabase = await createClient();

  const [
    { data: profile },
    { data: wallet },
    { data: items },
    { data: orders },
    { data: visits },
    { data: held },
    { data: feeSetting },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
    supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle(),
    supabase.from("items").select("id, title, status, list_price, item_photos(url)").order("created_at", { ascending: false }),
    supabase.from("orders").select("id, sale_price, status, created_at, items(title)").eq("buyer_id", user!.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("pickup_visits").select("id, scheduled_date, slot, status").order("scheduled_date", { ascending: false }).limit(3),
    supabase.from("orders").select("seller_payout, items!inner(seller_id)").eq("payout_status", "held").eq("items.seller_id", user!.id),
    supabase.from("settings").select("value").eq("key", "visit_fee").maybeSingle(),
  ]);

  const balance = Number(wallet?.balance ?? 0);
  const pending = (held ?? []).reduce((s, o) => s + Number(o.seller_payout), 0);
  const mine = items ?? [];
  const live = mine.filter((i) => i.status === "listed").length;
  const inProgress = mine.filter((i) =>
    ["accepted", "pickup_scheduled", "collected", "received", "inspected"].includes(i.status)
  ).length;
  const soldCount = mine.filter((i) =>
    ["sold", "in_transit", "delivered", "completed"].includes(i.status)
  ).length;
  const fee = ((feeSetting?.value ?? {}) as { amount?: number }).amount ?? 50;
  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const openVisit = (visits ?? []).find((v) => ["requested", "scheduled", "en_route"].includes(v.status));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {firstName ? `Hi ${firstName}` : "Your account"}
        </h1>
        <p className="mt-0.5 text-sm text-muted">Everything you&apos;re buying and selling with {BRAND.name}.</p>
      </div>

      {/* The two things we want them to do */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/sell"
          className="group flex items-start gap-3 rounded-2xl border-2 border-brand bg-brand p-5 text-brand-fg transition-transform hover:scale-[1.01]"
        >
          <Camera size={22} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold">Sell an item</div>
            <p className="mt-0.5 text-sm opacity-90">
              Snap a photo, get a price, we do the rest.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium">
              Start <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        <Link
          href="/account/visits"
          className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand"
        >
          <CalendarCheck size={22} className="mt-0.5 shrink-0 text-brand" />
          <div className="min-w-0">
            <div className="font-semibold">Book a home visit</div>
            <p className="mt-0.5 text-sm text-muted">
              Don&apos;t want to upload anything? We come to you, value everything on the spot and take it away.
              {formatMoney(fee)} — refunded on your first sale.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand">
              Book a visit <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* Money + inventory at a glance */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          href="/account/wallet"
          icon={<Wallet size={15} />}
          label="Wallet"
          value={formatMoney(balance)}
          sub={pending > 0 ? `${formatMoney(pending)} on the way` : "Available now"}
          accent
        />
        <StatCard href="/account/selling" icon={<Tag size={15} />} label="Live listings" value={String(live)} sub={inProgress > 0 ? `${inProgress} being processed` : "On sale now"} />
        <StatCard href="/account/selling" icon={<TrendingUp size={15} />} label="Items sold" value={String(soldCount)} sub={`${mine.length} listed all-time`} />
        <StatCard href="/account/orders" icon={<ShoppingBag size={15} />} label="Purchases" value={String((orders ?? []).length)} sub="Things you bought" />
      </div>

      {/* An open visit is the most time-sensitive thing on this page */}
      {openVisit && (
        <Link
          href="/account/visits"
          className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm transition-colors hover:border-accent"
        >
          <Clock size={17} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">
              Visit {openVisit.status === "en_route" ? "— our agent is on the way" : "booked"}
            </div>
            <div className="text-xs text-muted">
              {new Date(openVisit.scheduled_date).toLocaleDateString(BRAND.locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {openVisit.slot}
            </div>
          </div>
          <ArrowRight size={15} className="shrink-0 text-accent" />
        </Link>
      )}

      {/* Recent selling activity */}
      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Your items</h2>
          <Link href="/account/selling" className="text-xs font-medium text-brand hover:underline">
            See all
          </Link>
        </div>
        {mine.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted">You haven&apos;t listed anything yet.</p>
            <Link
              href="/sell"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-fg"
            >
              List your first item <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {mine.slice(0, 4).map((i) => {
              const photo = (i.item_photos as { url: string }[] | null)?.[0]?.url;
              return (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-bg">
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{i.title}</div>
                    <div className="text-xs capitalize text-muted">{i.status.replace(/_/g, " ")}</div>
                  </div>
                  <div className="shrink-0 text-sm font-semibold">
                    {i.list_price != null ? formatMoney(Number(i.list_price)) : "—"}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  sub,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition-colors ${
        accent ? "border-brand/40 bg-brand/5 hover:border-brand" : "border-border bg-surface hover:border-brand/50"
      }`}
    >
      <div className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full ${accent ? "bg-brand text-brand-fg" : "bg-brand/10 text-brand"}`}>
        {icon}
      </div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-0.5 text-[11px] text-muted">{sub}</div>
    </Link>
  );
}
