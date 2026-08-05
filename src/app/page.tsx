import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Truck,
  Sparkles,
  Tag,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/ThemeToggle";

const STEPS = [
  { icon: Camera, title: "Snap a photo", body: "Our AI values it in seconds — brand, condition, price, and how fast it'll sell." },
  { icon: Truck, title: "We collect", body: "Small items come to our studio. Bulky pieces stay home until they sell — no storage limbo." },
  { icon: Sparkles, title: "We inspect & shoot", body: "Tested, cleaned, certified, and photographed like a flagship store." },
  { icon: Tag, title: "We price & sell", body: "Dynamic pricing finds the best buyer fast. You set the floor; we never go below it." },
  { icon: Wallet, title: "You get paid", body: "Cash lands in your wallet the moment it sells. Withdraw or spend instantly." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/shop" className="hidden transition-colors hover:text-ink sm:inline">Shop</Link>
          <Link href="/sell" className="hidden transition-colors hover:text-ink sm:inline">Sell</Link>
          <ThemeToggle />
          <Link
            href="/sell"
            className="rounded-full bg-brand px-4 py-2 font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Start selling
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          <ShieldCheck size={13} className="text-brand" />
          Managed resale concierge · {BRAND.city}
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Sell everything in your home.
          <br />
          <span className="text-muted">Do absolutely nothing.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted">
          {BRAND.description} You just snap a photo and get paid.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Sell an item <ArrowRight size={16} />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 font-medium transition-colors hover:border-ink"
          >
            Browse the shop
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <s.icon size={18} />
              </div>
              <div className="mb-1 text-xs font-medium text-muted">Step {i + 1}</div>
              <h3 className="mb-1.5 font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent economics */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-surface p-8 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">Honest, transparent splits</h2>
          <p className="mt-2 max-w-2xl text-muted">
            You keep the majority — always. The higher your item sells for, the bigger your share.
            We only accept items worth everyone&apos;s while (AED 500+); we&apos;ll point smaller items to a
            simpler self-serve option rather than lose you money on handling.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { range: "AED 500 – 2,000", you: "60%" },
              { range: "AED 2,001 – 5,000", you: "65%" },
              { range: "Above AED 5,000", you: "70%" },
            ].map((t) => (
              <div key={t.range} className="rounded-2xl border border-border p-5">
                <div className="text-sm text-muted">{t.range}</div>
                <div className="mt-2 text-3xl font-semibold text-brand">{t.you}</div>
                <div className="text-sm text-muted">goes to you</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted sm:flex-row">
          <span>© {BRAND.name} — working codename. {BRAND.city}, UAE.</span>
          <span>{BRAND.supportEmail}</span>
        </div>
      </footer>
    </div>
  );
}
