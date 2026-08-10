import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";
import { CARD_SELECT, toCardItems } from "@/lib/store";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata = { title: `Saved - ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/saved");

  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_items")
    .select("item_id, created_at")
    .order("created_at", { ascending: false });

  const ids = (saved ?? []).map((s) => s.item_id);
  const { data: rows } = ids.length
    ? await supabase.from("items").select(CARD_SELECT).in("id", ids).eq("status", "listed")
    : { data: [] };

  const items = toCardItems(rows as never);
  const order = new Map(ids.map((id, i) => [id, i]));
  items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const goneCount = ids.length - items.length;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Saved items</h1>
      <p className="mt-0.5 text-sm text-muted">
        Every item is one of a kind — we&apos;ll alert you the moment one of these drops in price.
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-12 text-center">
          <Heart size={28} className="mx-auto text-muted" />
          <p className="mt-3 text-sm text-muted">
            {goneCount > 0
              ? "The items you saved have all sold — that's how fast one-of-a-kind moves."
              : "Nothing saved yet. Tap the heart on any product to watch it."}
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:opacity-90"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {items.map((it) => (
              <ProductCard key={it.id} item={it} />
            ))}
          </div>
          {goneCount > 0 && (
            <p className="mt-4 text-xs text-muted">
              {goneCount} saved {goneCount === 1 ? "item has" : "items have"} sold since you saved{" "}
              {goneCount === 1 ? "it" : "them"}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
