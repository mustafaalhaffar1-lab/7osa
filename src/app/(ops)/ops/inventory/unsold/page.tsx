import { createClient } from "@/lib/supabase/server";
import { UnsoldRows, type StuckItem } from "./UnsoldRows";

export const dynamic = "force-dynamic";

export default async function UnsoldPage() {
  const supabase = await createClient();

  const [{ data: items }, { data: policy }] = await Promise.all([
    supabase
      .from("items")
      .select("id, sku, title, brand, list_price, seller_min_price, retail_price, floor_reached_at, end_of_life_pref, company_owned, listed_at, item_photos(url), profiles!items_seller_id_fkey(full_name)")
      .eq("status", "listed")
      .not("floor_reached_at", "is", null)
      .order("floor_reached_at", { ascending: true }),
    supabase.from("settings").select("value").eq("key", "unsold_policy").maybeSingle(),
  ]);

  const graceDays =
    ((policy?.value ?? {}) as { days_at_floor_before_decision?: number })
      .days_at_floor_before_decision ?? 14;

  return (
    <div>
      <p className="text-sm text-muted">
        These items have dropped as far as the seller allows and stopped selling. Every one of
        them is costing storage — give it back, donate it, buy it outright, or relist it.
      </p>
      <UnsoldRows items={(items as unknown as StuckItem[]) ?? []} graceDays={graceDays} />
    </div>
  );
}
