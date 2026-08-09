import { createClient } from "@/lib/supabase/server";
import { ProductRows, type AdminItem } from "./ProductRows";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select(
      "id, sku, title, brand, status, possession, condition_grade, list_price, ai_estimate_min, ai_estimate_max, created_at, item_photos(url), item_metrics(views, saves)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <p className="text-sm text-muted">
        Scan or search to find an item, then open it to reprice, photograph, shelve or print its
        label. Sold items move to Archived.
      </p>
      <ProductRows items={(items as unknown as AdminItem[]) ?? []} />
    </div>
  );
}
