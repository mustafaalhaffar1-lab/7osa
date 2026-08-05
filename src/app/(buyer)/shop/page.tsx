import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Shop - ${BRAND.name}` };
export const dynamic = "force-dynamic";

const CONDITION_LABEL: Record<string, string> = {
  new: "New", like_new: "Like new", excellent: "Excellent", good: "Good", fair: "Fair",
};

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, title, brand, list_price, condition_grade, item_photos(url)")
    .eq("status", "listed")
    .order("listed_at", { ascending: false });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <p className="mt-1 text-sm text-muted">
          Pre-owned, professionally inspected, delivered across {BRAND.city}.
        </p>

        {!items?.length ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-12 text-center text-muted">
            No live listings yet — check back soon.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => {
              const photo = (it.item_photos as { url: string }[] | null)?.[0]?.url;
              return (
                <Link key={it.id} href={`/shop/${it.id}`} className="group">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={it.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted">No photo</div>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="truncate text-sm font-medium">{it.title}</div>
                    <div className="text-sm text-muted">
                      {it.list_price != null ? formatMoney(it.list_price) : ""}
                      {it.condition_grade ? ` · ${CONDITION_LABEL[it.condition_grade] ?? it.condition_grade}` : ""}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
