import { CalendarCheck, MapPin, Clock, Sparkles, Wallet, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { VisitForm } from "@/app/(seller)/sell/visit/VisitForm";

export const dynamic = "force-dynamic";

const SLOT_LABEL: Record<string, string> = {
  morning: "9am – 12pm",
  afternoon: "12 – 4pm",
  evening: "4 – 8pm",
};

const STATUS: Record<string, { label: string; hint: string; tone: string }> = {
  requested: { label: "Requested", hint: "We're confirming your slot", tone: "bg-accent/10 text-accent" },
  scheduled: { label: "Confirmed", hint: "See you then", tone: "bg-brand/10 text-brand" },
  en_route: { label: "On the way", hint: "Our agent is heading to you", tone: "bg-accent/10 text-accent" },
  completed: { label: "Completed", hint: "Thanks for using us", tone: "bg-green-500/10 text-green-600 dark:text-green-400" },
  cancelled: { label: "Cancelled", hint: "", tone: "bg-bg text-muted" },
};

export default async function VisitsPage() {
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: zones }, { data: visits }, { data: profile }, { data: feeSetting }] = await Promise.all([
    supabase.from("zones").select("id, name").eq("active", true).order("name"),
    supabase
      .from("pickup_visits")
      .select("id, address, building, unit, area, scheduled_date, slot, status, notes, fee_amount, fee_status")
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("phone, default_building, default_unit, default_area, default_makani, default_maps_url, default_access_notes")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase.from("settings").select("value").eq("key", "visit_fee").maybeSingle(),
  ]);

  const fee = ((feeSetting?.value ?? {}) as { amount?: number }).amount ?? 50;
  const list = visits ?? [];
  const open = list.filter((v) => ["requested", "scheduled", "en_route"].includes(v.status));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Home visits</h1>
        <p className="mt-0.5 text-sm text-muted">
          Don&apos;t want to photograph anything? We&apos;ll come to you.
        </p>
      </div>

      {/* How it works — sells the service without a wall of text */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: CalendarCheck, title: "Pick a time", body: "Choose a day and a window that suits you." },
          { icon: Sparkles, title: "We value it there", body: "Our agent prices everything in front of you." },
          { icon: Truck, title: "We take it away", body: "Whatever you agree to sell, we carry out." },
        ].map((s) => (
          <div key={s.title} className="rounded-2xl border border-border bg-surface p-4">
            <s.icon size={18} className="mb-2 text-brand" />
            <div className="text-sm font-semibold">{s.title}</div>
            <p className="mt-0.5 text-xs text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-brand/30 bg-brand/5 p-4 text-sm">
        <Wallet size={17} className="mt-0.5 shrink-0 text-brand" />
        <p>
          <span className="font-semibold">{formatMoney(fee)} per visit</span> — credited straight back to
          your wallet on your first sale. Sell one thing and the visit is free.
        </p>
      </div>

      {/* Existing visits */}
      {list.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted">
            {open.length > 0 ? "Your upcoming visits" : "Past visits"}
          </h2>
          <ul className="mt-2 space-y-2">
            {list.map((v) => {
              const st = STATUS[v.status] ?? { label: v.status, hint: "", tone: "bg-bg text-muted" };
              return (
                <li key={v.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {new Date(v.scheduled_date).toLocaleDateString(BRAND.locale, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Clock size={11} /> {SLOT_LABEL[v.slot] ?? v.slot}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.tone}`}>
                          {st.label}
                        </span>
                      </div>
                      {st.hint && <div className="mt-0.5 text-xs text-muted">{st.hint}</div>}
                      <div className="mt-1 inline-flex items-start gap-1 text-xs text-muted">
                        <MapPin size={11} className="mt-0.5 shrink-0" />
                        {[v.unit, v.building, v.area].filter(Boolean).join(", ") || v.address}
                      </div>
                      {v.notes && <p className="mt-1 text-xs italic text-muted">“{v.notes}”</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatMoney(Number(v.fee_amount))}</div>
                      <div className="text-[11px] text-muted">
                        {v.fee_status === "credited" ? "Credited back ✓" : "Refunded on 1st sale"}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Book another */}
      <section>
        <h2 className="text-sm font-semibold text-muted">
          {list.length > 0 ? "Book another visit" : "Book your visit"}
        </h2>
        <VisitForm
          zones={zones ?? []}
          defaults={{
            phone: profile?.phone,
            building: profile?.default_building,
            unit: profile?.default_unit,
            area: profile?.default_area,
            makani: profile?.default_makani,
            mapsUrl: profile?.default_maps_url,
            accessNotes: profile?.default_access_notes,
          }}
        />
      </section>
    </div>
  );
}
