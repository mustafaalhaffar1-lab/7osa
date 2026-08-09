import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { VisitPipeline, type PipelineVisit, type Stage } from "./VisitPipeline";

export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const supabase = await createClient();
  const me = await getUser();

  const [{ data: stages }, { data: visits }, { data: amAdmin }] = await Promise.all([
    supabase.from("visit_stages").select("*").eq("active", true).order("sequence"),
    supabase
      .from("pickup_visits")
      .select("id, stage_id, status, address, building, unit, area, scheduled_date, slot, notes, fee_amount, fee_status, items_collected, report_submitted_at, contact_phone, seller_id, zones(name), profiles!pickup_visits_seller_id_fkey(full_name)")
      .order("scheduled_date", { ascending: true }),
    me ? supabase.rpc("is_admin", { uid: me.id }) : Promise.resolve({ data: false } as const),
  ]);

  // How many visits each seller has had, so a card can say "3rd visit".
  const counts = new Map<string, number>();
  for (const v of visits ?? []) counts.set(v.seller_id, (counts.get(v.seller_id) ?? 0) + 1);

  return (
    <VisitPipeline
      stages={(stages as Stage[]) ?? []}
      visits={((visits as unknown as PipelineVisit[]) ?? []).map((v) => ({
        ...v,
        seller_visit_count: counts.get(v.seller_id) ?? 1,
      }))}
      amAdmin={Boolean(amAdmin)}
    />
  );
}
