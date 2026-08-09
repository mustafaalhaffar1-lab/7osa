import Link from "next/link";
import { PackageCheck, CalendarCheck, Truck, ClipboardList, QrCode, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * The warehouse door. Everything that has physically arrived but isn't ready to sell yet,
 * grouped by how it got here — a visit batch or an individual pickup.
 */
export default async function ReceivingPage() {
  const supabase = await createClient();

  const [{ data: items }, { data: visits }] = await Promise.all([
    supabase
      .from("items")
      .select("id, sku, title, brand, status, list_price, ai_estimate_min, ai_estimate_max, description, visit_id, shelf_code, created_at, item_photos(url), profiles!items_seller_id_fkey(full_name)")
      .in("status", ["collected", "received", "inspected"])
      .order("created_at", { ascending: true }),
    supabase
      .from("pickup_visits")
      .select("id, scheduled_date, report_summary, declined_notes, report_submitted_at, items_collected, profiles!pickup_visits_seller_id_fkey(full_name)")
      .not("report_submitted_at", "is", null)
      .order("report_submitted_at", { ascending: false }),
  ]);

  const list = items ?? [];
  const byVisit = new Map<string, typeof list>();
  const loose: typeof list = [];
  for (const it of list) {
    if (it.visit_id) {
      byVisit.set(it.visit_id, [...(byVisit.get(it.visit_id) ?? []), it]);
    } else {
      loose.push(it);
    }
  }

  const visitBatches = (visits ?? [])
    .map((v) => ({ visit: v, items: byVisit.get(v.id) ?? [] }))
    .filter((b) => b.items.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Receiving</h1>
        <p className="mt-0.5 text-sm text-muted">
          Goods that have arrived and still need inspecting, photographing, barcoding and pricing
          before they go on sale.
        </p>
      </div>

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
                    </div>
                  </div>
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
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Truck size={15} className="text-brand" /> Collected individually
                </h2>
                <span className="text-xs text-muted">{loose.length} to process</span>
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

type Row = {
  id: string;
  sku: string | null;
  title: string;
  brand: string | null;
  status: string;
  list_price: number | null;
  ai_estimate_min: number | null;
  ai_estimate_max: number | null;
  description: string | null;
  shelf_code: string | null;
  item_photos: { url: string }[] | null;
};

/** What still needs doing to this item before it can be listed. */
function nextStep(it: Row): { label: string; done: boolean }[] {
  const photos = it.item_photos?.length ?? 0;
  return [
    { label: "Inspect", done: it.status === "inspected" },
    { label: "Photos", done: photos > 1 },
    { label: "Shelf", done: Boolean(it.shelf_code) },
    { label: "Price", done: it.list_price != null },
  ];
}

function ReceivingRow({ item }: { item: Row }) {
  const photo = item.item_photos?.[0]?.url;
  const steps = nextStep(item);
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <li>
      <Link href={`/ops/inventory/products/${item.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bg">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {item.brand ? `${item.brand} · ` : ""}
            {item.title}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.sku && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand">
                <QrCode size={10} /> {item.sku}
              </span>
            )}
            <span className="capitalize">{item.status}</span>
            {item.ai_estimate_min != null && item.ai_estimate_max != null && (
              <span>
                est. {formatMoney(Number(item.ai_estimate_min))} – {formatMoney(Number(item.ai_estimate_max))}
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-1 truncate text-xs italic text-muted">“{item.description}”</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {steps.map((s) => (
              <span
                key={s.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  s.done ? "bg-green-500/10 text-green-600 dark:text-green-400" : "border border-border text-muted"
                }`}
              >
                {s.done ? "✓ " : ""}
                {s.label}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-medium text-muted">
            {remaining === 0 ? "Ready to list" : `${remaining} step${remaining === 1 ? "" : "s"} left`}
          </div>
          <ArrowRight size={15} className="ml-auto mt-1 text-muted" />
        </div>
      </Link>
    </li>
  );
}
