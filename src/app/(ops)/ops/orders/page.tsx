import { createClient } from "@/lib/supabase/server";
import { OrderRows, type AdminOrder } from "./OrderRows";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, sale_price, commission_amount, seller_payout, status, payment_method, created_at, items(title, item_photos(url))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
      <p className="mt-1 text-sm text-muted">
        Advance fulfilment — the item and delivery job stay in sync automatically.
      </p>
      <OrderRows orders={(orders as unknown as AdminOrder[]) ?? []} />
    </div>
  );
}
