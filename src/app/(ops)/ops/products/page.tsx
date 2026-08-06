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
      <h1 className="text-xl font-semibold tracking-tight">Products</h1>
      <p className="mt-1 text-sm text-muted">
        Live inventory — reprice, override status, or print a barcode label. Sold items move to Archived.
      </p>
      <ProductRows items={(items as unknown as AdminItem[]) ?? []} />
    </div>
  );
}
