import { createClient } from "@/lib/supabase/server";
import { ReturnRows, type AdminReturn } from "./ReturnRows";

export const dynamic = "force-dynamic";

export default async function OpsReturnsPage() {
  const supabase = await createClient();
  const { data: returns } = await supabase
    .from("returns")
    .select("id, reason, description, status, refund_amount, resolution_note, created_at, orders(sale_price, seller_payout, payout_status, fulfilment, delivered_at, items(title, sku, item_photos(url))), profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Returns</h1>
      <p className="mt-1 text-sm text-muted">
        Judged case by case. While a return is open the seller&apos;s payout stays frozen — approving
        it cancels the payout entirely if we haven&apos;t paid out yet.
      </p>
      <ReturnRows returns={(returns as unknown as AdminReturn[]) ?? []} />
    </div>
  );
}
