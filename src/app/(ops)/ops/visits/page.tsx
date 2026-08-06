import { createClient } from "@/lib/supabase/server";
import { VisitRows, type AdminVisit } from "./VisitRows";

export const dynamic = "force-dynamic";

export default async function OpsVisitsPage() {
  const supabase = await createClient();
  const { data: visits } = await supabase
    .from("pickup_visits")
    .select("id, address, scheduled_date, slot, notes, status, fee_amount, fee_status, created_at, zones(name), profiles!pickup_visits_seller_id_fkey(full_name)")
    .order("scheduled_date", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Pickup visits</h1>
      <p className="mt-1 text-sm text-muted">
        Sellers who asked us to come and value their items. The AED 50 fee is credited back
        automatically on their first sale.
      </p>
      <VisitRows visits={(visits as unknown as AdminVisit[]) ?? []} />
    </div>
  );
}
