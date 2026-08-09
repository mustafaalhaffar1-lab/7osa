import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, User, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { JourneyTimeline, visitJourney } from "@/components/ops/JourneyTimeline";
import { CollectPanel } from "./CollectPanel";

export const dynamic = "force-dynamic";

const SLOT_LABEL: Record<string, string> = {
  morning: "9am–12pm",
  afternoon: "12–4pm",
  evening: "4–8pm",
};

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: visit } = await supabase
    .from("pickup_visits")
    .select("*, zones(name), profiles!pickup_visits_seller_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!visit) notFound();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from("items")
      .select("id, sku, title, brand, status, list_price, ai_estimate_min, ai_estimate_max, created_at")
      .eq("visit_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("active", true).order("name"),
  ]);

  const list = items ?? [];
  const count = (pred: (s: string) => boolean) => list.filter((i) => pred(i.status as string)).length;
  const journey = visitJourney(visit.status as string, {
    collected: list.length,
    inspected: count((s) => ["inspected", "listed", "reserved", "sold", "in_transit", "delivered", "completed"].includes(s)),
    listed: count((s) => ["listed", "reserved", "sold", "in_transit", "delivered", "completed"].includes(s)),
    sold: count((s) => ["sold", "in_transit", "delivered", "completed"].includes(s)),
    delivered: count((s) => ["delivered", "completed"].includes(s)),
    paid: count((s) => s === "completed"),
  });

  const estValue = list.reduce((sum, i) => sum + Number(i.list_price ?? 0), 0);

  return (
    <div>
      <Link href="/ops/visits" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft size={15} /> All visits
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {new Date(visit.scheduled_date as string).toLocaleDateString(BRAND.locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} /> {SLOT_LABEL[visit.slot as string] ?? visit.slot}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User size={13} /> {(visit.profiles as { full_name: string | null } | null)?.full_name ?? "Seller"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} /> {visit.address as string}
                {(visit.zones as { name: string } | null)?.name ? ` · ${(visit.zones as { name: string }).name}` : ""}
              </span>
            </div>
            {visit.notes ? <p className="mt-2 text-sm italic text-muted">“{visit.notes as string}”</p> : null}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
              {String(visit.status).replace("_", " ")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                visit.fee_status === "credited"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-accent/10 text-accent"
              }`}
            >
              <Wallet size={12} />
              {visit.fee_status === "credited"
                ? `${formatMoney(Number(visit.fee_amount))} credited back`
                : `${formatMoney(Number(visit.fee_amount))} fee — credits on 1st sale`}
            </span>
          </div>
        </div>

        {/* The cycle, visualised */}
        <div className="mt-6 border-t border-border pt-5">
          <JourneyTimeline steps={journey} />
        </div>

        {/* The agent's report, once submitted */}
        {visit.report_submitted_at ? (
          <div className="mt-5 rounded-2xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Agent&apos;s report</h2>
            <p className="mt-1 text-xs text-muted">
              Submitted{" "}
              {new Date(visit.report_submitted_at as string).toLocaleString(BRAND.locale, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {visit.report_summary ? (
              <p className="mt-2 text-sm">{visit.report_summary as string}</p>
            ) : null}
            {visit.declined_notes ? (
              <p className="mt-1.5 text-sm text-muted">
                <span className="font-medium text-ink">Not taken:</span> {visit.declined_notes as string}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Collected items + add form */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Collected on this visit</h2>
            <span className="text-xs text-muted">
              {list.length} item{list.length === 1 ? "" : "s"}
              {estValue > 0 ? ` · ${formatMoney(estValue)} est.` : ""}
            </span>
          </div>
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              Nothing collected yet. Add each item the agent takes — it goes straight into the
              inspection queue.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((i) => (
                <li key={i.id}>
                  <Link href={`/ops/inventory/products/${i.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-bg">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {i.brand ? `${i.brand} · ` : ""}
                        {i.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        {i.sku && <span className="font-mono text-[11px] text-brand">{i.sku}</span>}
                        <span className="capitalize">{String(i.status).replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold">
                      {i.list_price != null ? formatMoney(Number(i.list_price)) : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <CollectPanel
          visitId={id}
          categories={categories ?? []}
          collectedCount={list.length}
          submitted={Boolean(visit.report_submitted_at)}
        />
      </div>
    </div>
  );
}
