import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard, type CardItem } from "@/components/store/ProductCard";
import { CARD_SELECT, toCardItems } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `${BRAND.name} — Amazing deals on inspected pre-owned`,
  description: BRAND.description,
};
export const dynamic = "force-dynamic";

type Section = { key: string; title: string; href: string; items: CardItem[] };

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUser();

  const [{ data: rows }, { data: categories }] = await Promise.all([
    supabase.from("items").select(CARD_SELECT).eq("status", "listed").order("listed_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("active", true).order("name"),
  ]);

  const all = toCardItems(rows as never);

  // Track how often each item has been placed so sections prefer fresh faces.
  const used = new Map<string, number>();
  function pick(items: CardItem[], cap = 12): CardItem[] {
    const chosen = items
      .slice()
      .sort((a, b) => (used.get(a.id) ?? 0) - (used.get(b.id) ?? 0))
      .slice(0, cap);
    for (const c of chosen) used.set(c.id, (used.get(c.id) ?? 0) + 1);
    return chosen;
  }

  const sections: Section[] = [];
  const add = (key: string, title: string, items: CardItem[], href = "/shop") => {
    if (items.length > 0) sections.push({ key, title, href, items });
  };

  add("drops", "🔥 Just dropped in price", pick(all.filter((i) => i.priceDropped)));
  add("new", "🆕 Just arrived", pick(all.slice(0, 12)));
  add(
    "savings",
    "💰 Biggest savings",
    pick([...all].filter((i) => (i.saveAmount ?? 0) > 0).sort((a, b) => (b.saveAmount ?? 0) - (a.saveAmount ?? 0)))
  );
  add(
    "fast",
    "⚡ Selling fast",
    pick([...all].filter((i) => i.views > 0).sort((a, b) => b.views - a.views))
  );
  add(
    "saved",
    "❤️ Most saved",
    pick([...all].filter((i) => i.saves > 0).sort((a, b) => b.saves - a.saves))
  );
  add(
    "lastchance",
    "🏷 Last chance — price changes soon",
    pick(
      [...all]
        .filter((i) => i.nextDropDays != null && i.nextDropDays <= 5)
        .sort((a, b) => (a.nextDropDays ?? 99) - (b.nextDropDays ?? 99))
    )
  );
  add("under1000", "💎 Under AED 1,000", pick(all.filter((i) => i.listPrice < 1000)), "/shop?q=under+1000");

  // Recommended: categories the signed-in user has actually bought from.
  if (user) {
    const { data: myOrders } = await supabase.from("orders").select("items(category_id)");
    const cats = new Set(
      (myOrders ?? [])
        .map((o) => (o.items as { category_id: string | null } | null)?.category_id)
        .filter(Boolean)
    );
    if (cats.size > 0) {
      add(
        "foryou",
        "⭐ Recommended for you",
        pick(all.filter((i) => i.categoryId && cats.has(i.categoryId) && i.sellerId !== user.id))
      );
    }
  }

  // A row per category that actually has inventory.
  for (const c of categories ?? []) {
    const catItems = all.filter((i) => i.categoryId === c.id);
    if (catItems.length > 0) add(`cat-${c.id}`, c.name, pick(catItems), `/shop?category=${c.id}`);
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* One-line trust strip — the only non-product content above the fold */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-b border-border py-2.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-brand" /> Every item inspected, cleaned & certified</span>
          <span className="inline-flex items-center gap-1.5"><Truck size={13} className="text-brand" /> Fast delivery across {BRAND.city}</span>
          <span className="inline-flex items-center gap-1.5"><Wallet size={13} className="text-brand" /> Prices drop until sold — buy before someone else does</span>
        </div>

        {all.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border bg-surface p-16 text-center text-muted">
            New inventory arriving soon — check back shortly.
          </div>
        ) : (
          sections.map((s, idx) => (
            <section key={s.key} className="fade-up mt-8" style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
                <Link href={s.href} className="text-sm font-medium text-brand transition-opacity hover:opacity-80">
                  See all →
                </Link>
              </div>
              <div className="flex snap-x gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {s.items.map((item) => (
                  <ProductCard key={`${s.key}-${item.id}`} item={item} className="w-44 shrink-0 snap-start sm:w-52" />
                ))}
              </div>
            </section>
          ))
        )}

        {/* Single-line supply hook */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 rounded-2xl bg-brand px-6 py-5 text-brand-fg sm:flex-row">
          <p className="text-sm font-medium">
            Have things you no longer need? We collect, sell, and pay you — you do nothing.
          </p>
          <Link
            href="/sell"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-bg px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
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
