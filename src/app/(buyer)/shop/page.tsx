import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { CARD_SELECT, toCardItems } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Shop - ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select(CARD_SELECT)
    .eq("status", "listed")
    .order("listed_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (q) {
    // Strip characters that would break the PostgREST or() filter syntax.
    const safe = q.replace(/[,()%]/g, " ").trim();
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`);
    }
  }

  const { data: rows } = await query;
  const items = toCardItems(rows as never);

  let categoryName: string | null = null;
  if (category) {
    const { data: cat } = await supabase.from("categories").select("name").eq("id", category).maybeSingle();
    categoryName = cat?.name ?? null;
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            {q ? `Results for “${q}”` : categoryName ?? "All items"}
          </h1>
          <span className="text-sm text-muted">{items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center text-muted">
            {q ? "Nothing matches that search — try a different term." : "No live listings here yet."}
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
