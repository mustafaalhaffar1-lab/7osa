import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { isoDate } from "@/lib/logistics";
import { DriverDay, type DriverJob } from "./DriverDay";

export const dynamic = "force-dynamic";
export const metadata = { title: `My day - ${BRAND.name}` };

export default async function DriverPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const date = sp.date || isoDate(new Date());
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("logistics_jobs")
    .select(
      "id, type, status, slot, sequence, contact_name, contact_phone, address, building, unit, area, makani, maps_url, access_notes, notes, needs_two_people, attempt_count, visit_id, items(title, sku)"
    )
    .eq("driver_id", user.id)
    .eq("scheduled_date", date)
    .order("sequence", { nullsFirst: false });

  const list = (jobs as unknown as DriverJob[]) ?? [];

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <div className="text-base font-bold tracking-tight">{BRAND.name} · My day</div>
            <div className="text-xs text-muted">
              {new Date(date + "T12:00:00").toLocaleDateString("en-AE", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
          <Link href="/" className="text-xs text-muted hover:text-ink">
            Exit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <DriverDay jobs={list} />
      </main>
    </div>
  );
}
