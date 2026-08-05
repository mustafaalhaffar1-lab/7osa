import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { CARD_SELECT, toCardItems, parseQuery } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Shop - ${BRAND.name}` };
export const dynamic = "force-dynamic";

type Params = {
  q?: string;
  category?: string;
  cond?: string;
  sort?: string;
  under?: string;
  dropped?: string;
};

const CONDITIONS = [
  ["", "Any condition"],
  ["new", "New"],
  ["like_new", "Like new"],
  ["excellent", "Excellent"],
  ["good", "Good"],
  ["fair", "Fair"],
] as const;

const SORTS = [
  ["newest", "Newest"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["discount", "Biggest discount"],
] as const;

const UNDER = [
  ["", "Any price"],
  ["500", "Under AED 500"],
  ["1000", "Under AED 1,000"],
  ["2000", "Under AED 2,000"],
  ["5000", "Under AED 5,000"],
] as const;

export default async function ShopPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Natural-language search: "office chair under aed 400" → keywords + price cap.
  const parsed = sp.q ? parseQuery(sp.q) : { keywords: "", under: null, over: null };
  const underCap = parsed.under ?? (sp.under ? parseInt(sp.under, 10) : null);

  let query = supabase.from("items").select(CARD_SELECT).eq("status", "listed");

  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.cond) query = query.eq("condition_grade", sp.cond as never);
  if (underCap) query = query.lte("list_price", underCap);
  if (parsed.over) query = query.gte("list_price", parsed.over);

  const safe = parsed.keywords.replace(/[,()%]/g, " ").trim();
  if (safe) {
    query = query.or(`title.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`);
  }

  const sort = sp.sort ?? "newest";
  if (sort === "price_asc") query = query.order("list_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("list_price", { ascending: false });
  else query = query.order("listed_at", { ascending: false });

  const { data: rows } = await query;
  let items = toCardItems(rows as never);

  if (sp.dropped === "1") items = items.filter((i) => i.priceDropped);
  if (sort === "discount") items = [...items].sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));

  let categoryName: string | null = null;
  if (sp.category) {
    const { data: cat } = await supabase.from("categories").select("name").eq("id", sp.category).maybeSingle();
    categoryName = cat?.name ?? null;
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {sp.q ? `Results for “${sp.q}”` : categoryName ?? "All items"}
          </h1>
          <span className="text-sm text-muted">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Filters — plain GET form, keeps q/category */}
        <form method="get" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          <Select name="cond" current={sp.cond ?? ""} options={CONDITIONS} />
          <Select name="under" current={sp.under ?? ""} options={UNDER} />
          <Select name="sort" current={sort} options={SORTS} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3 py-2">
            <input type="checkbox" name="dropped" value="1" defaultChecked={sp.dropped === "1"} className="accent-[rgb(var(--brand))]" />
            Price dropped
          </label>
          <button className="rounded-full bg-brand px-4 py-2 font-medium text-brand-fg transition-opacity hover:opacity-90">
            Apply
          </button>
        </form>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center text-muted">
            {sp.q
              ? "Nothing matches that search — try different words, or loosen the filters."
              : "No live listings match these filters yet."}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Select({
  name,
  current,
  options,
}: {
  name: string;
  current: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <select
      name={name}
      defaultValue={current}
      className="rounded-full border border-border bg-surface px-3 py-2 outline-none transition-colors focus:border-brand"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
