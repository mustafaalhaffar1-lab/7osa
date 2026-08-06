import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Truck,
  Sparkles,
  Tag,
  Wallet,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/format";

type Tier = { min_price: number; max_price: number | null; marketplace_pct: number };

const BENEFITS = [
  { icon: Sparkles, title: "Zero effort", body: "No photos, no listings, no chats, no meetups. You do nothing." },
  { icon: Truck, title: "Free doorstep pickup", body: "We come to you, on your schedule. Bulky items stay home until they sell." },
  { icon: ShieldCheck, title: "Expertly handled", body: "Inspected, cleaned, and photographed like a flagship store." },
  { icon: Tag, title: "Smart pricing", body: "AI and live market data find the right buyer, fast — never below your floor." },
  { icon: Wallet, title: "Paid when it sells", body: "Money lands in your wallet the moment it sells. Withdraw anytime." },
  { icon: EyeOff, title: "Completely private", body: "Buyers never see who you are. We're the trusted middleman." },
];

const STEPS = [
  "Snap a photo — get an instant AI valuation and payout estimate.",
  "Accept and book a free pickup.",
  "We inspect, photograph, price, and list it for you.",
  "It sells — you're paid instantly.",
];

function tierLabel(t: Tier, isFirst: boolean): string {
  if (t.max_price == null) return `Over ${formatMoney(t.min_price)}`;
  if (isFirst) return `Up to ${formatMoney(t.max_price)}`;
  return `${formatMoney(t.min_price)} – ${formatMoney(t.max_price)}`;
}

export function SellPitch({
  tiers,
  floor,
  isAuthed,
}: {
  tiers: Tier[];
  floor: number;
  isAuthed: boolean;
}) {
  const primaryHref = isAuthed ? "#list" : "/login";
  const primaryLabel = isAuthed ? "List an item" : "Create an account to start";

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-14 text-center sm:pt-20">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          <Tag size={13} className="text-brand" /> Sell with {BRAND.name}
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Your unused things are worth money.
          <br />
          <span className="text-muted">We do all the work.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted">
          Skip the photos, the listings, the lowball offers, and the no-shows. Book a free pickup —
          we collect, inspect, clean, photograph, price, sell, and deliver. You just get paid.
        </p>
        {/* Two ways in — the concierge visit, or list it yourself */}
        <div className="mx-auto mt-9 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border-2 border-brand bg-surface p-6">
            <div className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-fg">
              Easiest
            </div>
            <h3 className="mt-1 text-lg font-semibold">We come to you</h3>
            <p className="mt-1 flex-1 text-sm text-muted">
              An agent visits, values everything on the spot, and takes what you agree to sell.
              AED 50 — credited back in full on your first sale.
            </p>
            <Link
              href={isAuthed ? "/sell/visit" : "/login"}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90"
            >
              Book a pickup visit <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold">List it yourself</h3>
            <p className="mt-1 flex-1 text-sm text-muted">
              Snap a photo, we identify it and suggest a price range, you pick your price.
              Then we collect it — or leave it home until it sells.
            </p>
            <Link
              href={primaryHref}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:border-ink"
            >
              {primaryLabel} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why sell with us */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Why sell with {BRAND.name}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <b.icon size={18} />
              </div>
              <h3 className="mb-1 font-semibold">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The percentages */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-border bg-surface p-8 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">You keep the majority — always</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Our commission covers everything — pickup, cleaning, photography, storage, marketing,
            payments, and delivery. The higher your item sells for, the bigger your share.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {tiers.map((t, i) => {
              const sellerPct = Math.round((1 - t.marketplace_pct) * 100);
              return (
                <div key={i} className="rounded-2xl border border-border p-5">
                  <div className="text-sm text-muted">{tierLabel(t, i === 0)}</div>
                  <div className="mt-2 text-4xl font-semibold text-brand">{sellerPct}%</div>
                  <div className="text-sm text-muted">goes to you</div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-muted">
            We focus on items likely to sell for {formatMoney(floor)}+, so our full-service handling
            never eats into the value of small items.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-muted">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
          <Camera size={15} className="text-brand" />
          It starts with one photo.
        </div>
      </section>
    </div>
  );
}
