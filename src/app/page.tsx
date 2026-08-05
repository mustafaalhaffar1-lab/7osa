import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard, type CardItem } from "@/components/store/ProductCard";
import { CARD_SELECT, toCardItems } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `${BRAND.name} — Shop quality pre-owned`,
  description: BRAND.description,
};
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUser();

  const { data: rows } = await supabase
    .from("items")
    .select(CARD_SELECT)
    .eq("status", "listed")
    .order("listed_at", { ascending: false });

  const all = toCardItems(rows as never);

  // Merchandising sections, derived from real signals. Empty sections hide themselves.
  const recent = all.slice(0, 12);
  const featured = [...all].sort((a, b) => b.listPrice - a.listPrice).slice(0, 12);
  const drops = all.filter((i) => i.priceDropped).slice(0, 12);
  const deals = all
    .filter((i) => (i.discountPct ?? 0) >= 25)
    .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))
    .slice(0, 12);
  const trending = all
    .filter((i) => i.condition === "like_new" || i.condition === "excellent")
    .slice(0, 12);

  // Recommended: categories the signed-in user has bought from (real signal; hidden otherwise).
  let recommended: CardItem[] = [];
  if (user) {
    const { data: myOrders } = await supabase.from("orders").select("items(category_id)");
    const cats = new Set(
      (myOrders ?? [])
        .map((o) => (o.items as { category_id: string | null } | null)?.category_id)
        .filter(Boolean)
    );
    if (cats.size > 0) {
      recommended = all
        .filter((i) => i.categoryId && cats.has(i.categoryId) && i.sellerId !== user.id)
        .slice(0, 12);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* Slim trust strip — the only non-product content on the page */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-b border-border py-2.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-brand" /> Every item inspected & certified</span>
          <span className="inline-flex items-center gap-1.5"><Truck size={13} className="text-brand" /> Fast delivery across {BRAND.city}</span>
          <span className="inline-flex items-center gap-1.5"><Wallet size={13} className="text-brand" /> Sellers paid instantly</span>
        </div>

        {all.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border bg-surface p-16 text-center text-muted">
            New inventory arriving soon — check back shortly.
          </div>
        ) : (
          <>
            <Section title="Featured" items={featured} />
            {drops.length > 0 && <Section title="Price drops" items={drops} accent />}
            {deals.length > 0 && <Section title="Best deals" items={deals} />}
            {recommended.length > 0 && <Section title="Recommended for you" items={recommended} />}
            {trending.length > 0 && <Section title="Trending" items={trending} />}
            <Section title="Recently added" items={recent} />
          </>
        )}

        {/* One-line supply hook — reinforces Sell without a marketing page */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 rounded-2xl bg-brand px-6 py-5 text-brand-fg sm:flex-row">
          <p className="text-sm font-medium">
            Have things you no longer need? We collect, sell, and pay you — you do nothing.
          </p>
          <Link
            href="/sell"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-bg px-5 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Get a free pickup <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted sm:flex-row">
          <span>© {BRAND.name} — {BRAND.city}, UAE</span>
          <span>{BRAND.supportEmail}</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, items, accent }: { title: string; items: CardItem[]; accent?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-lg font-semibold tracking-tight ${accent ? "text-accent" : ""}`}>{title}</h2>
        <Link href="/shop" className="text-sm text-muted transition-colors hover:text-ink">
          See all
        </Link>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} className="w-44 shrink-0 snap-start sm:w-52" />
        ))}
      </div>
    </section>
  );
}
