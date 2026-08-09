import { createClient } from "@/lib/supabase/server";
import { isoDate } from "@/lib/logistics";
import { DispatchBoard, type DispatchJob, type Assignee } from "./DispatchBoard";

export const dynamic = "force-dynamic";

export default async function LogisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; zone?: string; lane?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || isoDate(new Date());
  const lane = sp.lane === "visits" ? "visits" : "transport";
  const supabase = await createClient();

  const [{ data: jobs }, { data: users }, { data: carriers }, { data: zones }] = await Promise.all([
    supabase
      .from("logistics_jobs")
      .select(
        "id, type, status, scheduled_date, slot, sequence, driver_id, carrier_id, visit_id, tracking_ref, contact_name, contact_phone, alt_phone, address, building, unit, area, makani, maps_url, access_notes, notes, needs_two_people, attempt_count, failure_reason, completion_notes, zone_id, items(title, sku), zones(name)"
      )
      .eq("scheduled_date", date)
      .order("sequence", { nullsFirst: false }),
    supabase.rpc("ops_list_users"),
    supabase.from("carriers").select("id, name, kind, tracking_url").eq("active", true).order("kind"),
    supabase.from("zones").select("id, name").eq("active", true).order("name"),
  ]);

  // Anyone with a staff role can be sent on a job — most teams are small at the start.
  const drivers: Assignee[] = (
    (users as { id: string; full_name: string | null; email: string; roles: string[] }[]) ?? []
  )
    .filter((u) => u.roles.length > 0)
    .map((u) => ({ id: u.id, name: u.full_name || u.email, kind: "driver" as const }));

  const carrierList: Assignee[] = ((carriers as { id: string; name: string; kind: string }[]) ?? [])
    .filter((c) => c.kind !== "in_house")
    .map((c) => ({ id: c.id, name: c.name, kind: "carrier" as const }));

  // Visits are a different job to a courier run — plan them in their own lane.
  const all = (jobs as unknown as DispatchJob[]) ?? [];
  const visitJobs = all.filter((j) => j.type === "visit");
  const transportJobs = all.filter((j) => j.type !== "visit");

  return (
    <DispatchBoard
      date={date}
      lane={lane}
      jobs={lane === "visits" ? visitJobs : transportJobs}
      visitCount={visitJobs.length}
      transportCount={transportJobs.length}
      drivers={drivers}
      carriers={carrierList}
      zones={zones ?? []}
      zoneFilter={sp.zone ?? ""}
    />
  );
}
