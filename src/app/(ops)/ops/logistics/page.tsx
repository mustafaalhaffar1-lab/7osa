import { createClient } from "@/lib/supabase/server";
import { JobRows, type AdminJob, type DriverOption } from "./JobRows";

export const dynamic = "force-dynamic";

export default async function OpsLogisticsPage() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: users }] = await Promise.all([
    supabase
      .from("logistics_jobs")
      .select("id, type, status, address, scheduled_from, scheduled_to, driver_id, created_at, items(title, sku, seller_address), zones(name)")
      .order("created_at", { ascending: false }),
    supabase.rpc("ops_list_users"),
  ]);

  const drivers: DriverOption[] = (
    (users as { id: string; full_name: string | null; email: string; roles: string[] }[]) ?? []
  )
    .filter((u) => u.roles.includes("driver") || u.roles.includes("ops_agent") || u.roles.includes("admin"))
    .map((u) => ({ id: u.id, name: u.full_name || u.email }));

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Logistics</h1>
      <p className="mt-1 text-sm text-muted">
        Every pickup and delivery. Assign a driver, then move the job along — completing a job
        updates the item automatically.
      </p>
      <JobRows jobs={(jobs as unknown as AdminJob[]) ?? []} drivers={drivers} />
    </div>
  );
}
