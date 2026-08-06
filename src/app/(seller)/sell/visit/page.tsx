import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import { VisitForm } from "./VisitForm";

export const metadata = { title: `Book a pickup visit - ${BRAND.name}` };
export const dynamic = "force-dynamic";

const SLOT_LABEL: Record<string, string> = {
  morning: "Morning (9am–12pm)",
  afternoon: "Afternoon (12–4pm)",
  evening: "Evening (4–8pm)",
};
const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  scheduled: "Scheduled",
  en_route: "Agent on the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function VisitPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: zones }, { data: visits }] = await Promise.all([
    supabase.from("zones").select("id, name").eq("active", true).order("name"),
    supabase
      .from("pickup_visits")
      .select("id, address, scheduled_date, slot, status, fee_amount, fee_status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Book a pickup visit</h1>
        <p className="mt-2 text-muted">
          One of our agents comes to you, values your items on the spot, and takes whatever you
          agree to sell. No photos, no listings — you don&apos;t lift a finger.
        </p>

        <div className="mt-4 rounded-2xl border border-brand/30 bg-brand/5 p-4 text-sm">
          <span className="font-semibold text-brand">AED 50 booking fee — credited back in full</span>
          <p className="mt-1 text-muted">
            It covers the agent&apos;s trip, and we credit the full {formatMoney(50)} to your wallet on
            your first sale. Sell anything at all and the visit costs you nothing.
          </p>
        </div>

        <VisitForm zones={zones ?? []} />

        {visits && visits.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-muted">Your visits</h2>
            <ul className="mt-3 space-y-2">
              {visits.map((v) => (
                <li key={v.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {new Date(v.scheduled_date).toLocaleDateString(BRAND.locale, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {SLOT_LABEL[v.slot] ?? v.slot}
                      </div>
                      <div className="text-xs text-muted">{v.address}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                        {STATUS_LABEL[v.status] ?? v.status}
                      </span>
                      {v.fee_status === "credited" && (
                        <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                          Fee credited
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
