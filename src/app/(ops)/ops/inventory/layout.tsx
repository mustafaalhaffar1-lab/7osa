import { createClient } from "@/lib/supabase/server";
import { InventoryNav } from "./InventoryNav";

export const dynamic = "force-dynamic";

/** Inventory groups everything about the stock itself: the items, offers on them, and
 *  the ones that have stopped selling. Counts live here so the tabs show real pressure. */
export default async function InventoryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [{ count: products }, { count: offers }, { count: unsold }] = await Promise.all([
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("status", "listed")
      .not("floor_reached_at", "is", null),
  ]);

  return (
    <div>
      <InventoryNav counts={{ products: products ?? 0, offers: offers ?? 0, unsold: unsold ?? 0 }} />
      <div className="mt-5">{children}</div>
    </div>
  );
}
