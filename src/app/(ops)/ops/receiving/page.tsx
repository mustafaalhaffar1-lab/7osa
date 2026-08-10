import Link from "next/link";
import { PackageCheck, CalendarCheck, Truck, ClipboardList, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";
import { ReceivingRow, BatchReceiveButton, VanBanner, type ReceivingItem } from "./ReceivingBoard";

export const dynamic = "force-dynamic";

/**
 * The warehouse door. Everything collected but not yet sellable, grouped by how it got
 * here — a visit batch or an individual pickup — and actionable in place: book it in,
 * inspect it, price it, list it.
 */
export default async function ReceivingPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("items")
    .select("id, sku, title, brand, status, list_price, ai_estimate_min, ai_estimate_max, description, visit_id, shelf_code, created_at, item_photos(url), inspections(id)")
    .in("status", ["collected", "received", "inspected"])
    .order("created_at", { ascending: true });

  // Fetch visits by the ids the items actually reference. Keying off "report submitted"
  // instead hid any item collected on a visit whose report was never filed.
  const visitIds = [...new Set((items ?? []).map((i) => i.visit_id).filter(Boolean))] as string[];
  const { data: visits } = visitIds.length
    ? await supabase
        .from("pickup_visits")
        .select("id, scheduled_date, report_summary, declined_notes, report_submitted_at, items_collected, profiles!pickup_visits_seller_id_fkey(full_name)")
        .in("id", visitIds)
        .order("scheduled_date", { ascending: false })
    : { data: [] };

  const list: (ReceivingItem & { visit_id: string | null })[] = (items ?? []).map((it) => {
    const photos = (it.item_photos as { url: string }[] | null) ?? [];
    return {
      id: it.id,
      sku: it.sku,
      title: it.title,
      brand: it.brand,
      status: it.status,
      list_price: it.list_price,
      ai_estimate_min: it.ai_estimate_min,
      ai_estimate_max: it.ai_estimate_max,
      description: it.description,
      shelf_code: it.shelf_code,
      photo: photos[0]?.url ?? null,
      photoCount: photos.length,
      // An inspection record is the only honest source — status can be overridden by hand.
      inspected: ((it.inspections as { id: string }[] | null) ?? []).length > 0,
      visit_id: it.visit_id,
    };
  });

  const byVisit = new Map<string, typeof list>();
  const loose: typeof list = [];
  for (const it of list) {
    if (it.visit_id) byVisit.set(it.visit_id, [...(byVisit.get(it.visit_id) ?? []), it]);
    else loose.push(it);
  }

  const visitBatches = (visits ?? [])
    .map((v) => ({ visit: v, items: byVisit.get(v.id) ?? [] }))
    .filter((b) => b.items.length > 0);

  const inVan = list.filter((i) => i.status === "collected").length;
  const readyToList = list.filter((i) => i.status !== "collected" && i.inspected && i.list_price == null).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Receiving</h1>
          <p className="mt-0.5 text-sm text-muted">
            Everything collected but not yet on sale. Book it in, check it, photograph it, price it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Stat label="in the van" value={inVan} tone={inVan > 0 ? "warn" : undefined} />
          <Stat label="on the floor" value={list.length - inVan} />
          <Stat label="ready to list" value={readyToList} tone={readyToList > 0 ? "good" : undefined} />
        </div>
      </div>

      {inVan > 0 && <VanBanner count={inVan} />}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <PackageCheck size={26} className="mx-auto mb-2 text-muted opacity-50" />
          <p className="text-sm text-muted">Nothing waiting — the floor is clear.</p>
        </div>
      ) : (
        <>
          {/* Batches that came back from a paid visit */}
          {visitBatches.map(({ visit, items: batch }) => {
            const seller = (visit.profiles as { full_name: string | null } | null)?.full_name;
            const toReceive = batch.filter((i) => i.status === "collected").map((i) => i.id);
            return (
              <section key={visit.id} className="rounded-2xl border border-brand/30 bg-surface shadow-card">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                      <CalendarCheck size={15} className="text-brand" />
                      Visit batch · {seller ?? "Seller"}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>
                        {new Date(visit.scheduled_date).toLocaleDateString(BRAND.locale, {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand">
                        {batch.length} to process
                      </span>
                      <Link href={`/ops/visits/${visit.id}`} className="font-medium text-brand hover:underline">
                        Visit
                      </Link>
                      <BatchReceiveButton ids={toReceive} />
                    </div>
                  </div>
                  {!visit.report_submitted_at && (
                    <p className="mt-1.5 inline-flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      The agent hasn&apos;t filed a report for this visit yet —{" "}
                      <Link href={`/ops/visits/${visit.id}`} className="font-medium underline">
                        chase it
                      </Link>
                      .
                    </p>
                  )}
                  {visit.report_summary && (
                    <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs text-muted">
                      <ClipboardList size={12} className="mt-0.5 shrink-0" /> “{visit.report_summary}”
                    </p>
                  )}
                  {visit.declined_notes && (
                    <p className="mt-1 text-xs text-muted">
                      <span className="font-medium">Declined:</span> {visit.declined_notes}
                    </p>
                  )}
                </div>
                <ul className="divide-y divide-border">
                  {batch.map((it) => (
                    <ReceivingRow key={it.id} item={it} />
                  ))}
                </ul>
              </section>
            );
          })}

          {/* Individually collected items */}
          {loose.length > 0 && (
            <section className="rounded-2xl border border-border bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Truck size={15} className="text-brand" /> Collected individually
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{loose.length} to process</span>
                  <BatchReceiveButton ids={loose.filter((i) => i.status === "collected").map((i) => i.id)} />
                </div>
              </div>
              <ul className="divide-y divide-border">
                {loose.map((it) => (
                  <ReceivingRow key={it.id} item={it} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "good" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        tone === "warn"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : tone === "good"
            ? "border-brand/40 bg-brand/10 text-brand"
            : "border-border bg-surface text-muted"
      }`}
    >
      <span className="font-bold">{value}</span> {label}
    </span>
  );
}
