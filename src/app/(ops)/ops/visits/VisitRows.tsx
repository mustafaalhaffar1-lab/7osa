"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { setVisitStatus } from "../admin-actions";

export type AdminVisit = {
  id: string;
  address: string;
  scheduled_date: string;
  slot: string;
  notes: string | null;
  status: string;
  fee_amount: number;
  fee_status: string;
  created_at: string;
  zones: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

const SLOT_LABEL: Record<string, string> = {
  morning: "9am–12pm",
  afternoon: "12–4pm",
  evening: "4–8pm",
};

/** The forward path a visit takes. */
const NEXT: Record<string, { to: string; label: string } | undefined> = {
  requested: { to: "scheduled", label: "Confirm slot" },
  scheduled: { to: "en_route", label: "Agent on the way" },
  en_route: { to: "completed", label: "Mark completed" },
};

const OPEN = new Set(["requested", "scheduled", "en_route"]);

export function VisitRows({ visits }: { visits: AdminVisit[] }) {
  const open = visits.filter((v) => OPEN.has(v.status));
  const done = visits.filter((v) => !OPEN.has(v.status));

  if (visits.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        No visits booked yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Upcoming ({open.length})</h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Nothing scheduled.
          </p>
        ) : (
          <ul className="space-y-2">{open.map((v) => <Row key={v.id} visit={v} />)}</ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Past</h2>
          <ul className="space-y-2">{done.map((v) => <Row key={v.id} visit={v} />)}</ul>
        </section>
      )}
    </div>
  );
}

function Row({ visit }: { visit: AdminVisit }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = NEXT[visit.status];

  function move(to: string) {
    setError(null);
    start(async () => {
      const res = await setVisitStatus(visit.id, to);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {new Date(visit.scheduled_date).toLocaleDateString("en-AE", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock size={11} /> {SLOT_LABEL[visit.slot] ?? visit.slot}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-muted">
              {visit.status.replace("_", " ")}
            </span>
            {visit.fee_status === "credited" && (
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                Fee credited
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-medium">{visit.profiles?.full_name ?? "Seller"}</div>
          <div className="mt-0.5 inline-flex items-start gap-1.5 text-xs text-muted">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span>
              {visit.address}
              {visit.zones?.name ? ` · ${visit.zones.name}` : ""}
            </span>
          </div>
          {visit.notes && <p className="mt-1.5 text-xs italic text-muted">“{visit.notes}”</p>}
          <Link
            href={`/ops/visits/${visit.id}`}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            Open visit & log collected items <ChevronRight size={12} />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted">{formatMoney(Number(visit.fee_amount))} fee</span>
          {next && (
            <button
              disabled={pending}
              onClick={() => move(next.to)}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "…" : next.label}
            </button>
          )}
          {OPEN.has(visit.status) && (
            <button
              disabled={pending}
              onClick={() => move("cancelled")}
              className="rounded-full border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
