"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Clock,
  Settings2,
  Plus,
  Trash2,
  Repeat,
  PackageCheck,
  Wallet,
  X,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { setVisitStage, saveStage, deleteStage } from "./actions";

export type Stage = {
  id: string;
  name: string;
  sequence: number;
  maps_to_status: string | null;
  is_closed: boolean;
};

export type PipelineVisit = {
  id: string;
  stage_id: string | null;
  status: string;
  address: string;
  building: string | null;
  unit: string | null;
  area: string | null;
  scheduled_date: string;
  slot: string;
  notes: string | null;
  fee_amount: number;
  fee_status: string;
  items_collected: number;
  report_submitted_at: string | null;
  contact_phone: string | null;
  seller_id: string;
  zones: { name: string } | null;
  profiles: { full_name: string | null } | null;
  seller_visit_count: number;
};

const SLOT_SHORT: Record<string, string> = {
  morning: "9–12",
  afternoon: "12–4",
  evening: "4–8",
};

const STATUS_OPTIONS = [
  { value: "", label: "No status change" },
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "en_route", label: "On the way" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function VisitPipeline({
  stages,
  visits,
  amAdmin,
}: {
  stages: Stage[];
  visits: PipelineVisit[];
  amAdmin: boolean;
}) {
  const [managing, setManaging] = useState(false);

  const open = visits.filter((v) => {
    const s = stages.find((x) => x.id === v.stage_id);
    return !s?.is_closed;
  });
  const pipelineValue = open.reduce((sum, v) => sum + Number(v.fee_amount), 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Visits pipeline</h1>
          <p className="mt-0.5 text-sm text-muted">
            Every paid home visit, from request to collection. Move a card as the job progresses.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-border bg-surface px-3 py-1.5">
            <span className="font-bold text-ink">{open.length}</span> open
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1.5">
            <span className="font-bold text-ink">{formatMoney(pipelineValue)}</span> in fees
          </span>
          {amAdmin && (
            <button
              onClick={() => setManaging((m) => !m)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors ${
                managing ? "bg-brand text-brand-fg" : "border border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <Settings2 size={13} /> Stages
            </button>
          )}
        </div>
      </div>

      {managing && amAdmin && <StageManager stages={stages} onClose={() => setManaging(false)} />}

      {/* The pipeline: a column per stage, cards stacked vertically inside */}
      <div className="mt-5 flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage, i) => {
          const cards = visits.filter((v) => v.stage_id === stage.id);
          const prev = stages[i - 1];
          const next = stages[i + 1];
          return (
            <section key={stage.id} className="flex w-72 shrink-0 flex-col">
              <header
                className={`flex items-center justify-between rounded-t-xl border-x border-t px-3 py-2.5 ${
                  stage.is_closed ? "border-border bg-bg" : "border-brand/30 bg-brand/5"
                }`}
              >
                <h2 className="truncate text-sm font-semibold">{stage.name}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    cards.length > 0 && !stage.is_closed ? "bg-brand text-brand-fg" : "bg-surface text-muted"
                  }`}
                >
                  {cards.length}
                </span>
              </header>
              <div className="flex-1 space-y-2 rounded-b-xl border border-border bg-bg/50 p-2">
                {cards.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted">Empty</p>
                ) : (
                  cards.map((v) => (
                    <VisitCard key={v.id} visit={v} prevStage={prev} nextStage={next} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function VisitCard({
  visit,
  prevStage,
  nextStage,
}: {
  visit: PipelineVisit;
  prevStage?: Stage;
  nextStage?: Stage;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(stageId?: string) {
    if (!stageId) return;
    setError(null);
    start(async () => {
      const res = await setVisitStage(visit.id, stageId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  const where = [visit.unit, visit.building, visit.area].filter(Boolean).join(", ") || visit.address;
  const date = new Date(visit.scheduled_date);
  const overdue = date < new Date(new Date().toDateString()) && !visit.report_submitted_at;

  return (
    <article className="rounded-xl border border-border bg-surface p-3 shadow-card">
      <Link href={`/ops/visits/${visit.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {visit.profiles?.full_name ?? "Seller"}
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted">
              <Clock size={10} />
              <span className={overdue ? "font-medium text-red-500" : ""}>
                {date.toLocaleDateString("en-AE", { day: "numeric", month: "short" })} ·{" "}
                {SLOT_SHORT[visit.slot] ?? visit.slot}
              </span>
            </div>
          </div>
          {visit.seller_visit_count > 1 && (
            <span
              title={`${visit.seller_visit_count} visits from this customer`}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent"
            >
              <Repeat size={9} /> {visit.seller_visit_count}
            </span>
          )}
        </div>

        <div className="mt-1.5 inline-flex items-start gap-1 text-[11px] text-muted">
          <MapPin size={10} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{where}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-muted">
            <Wallet size={9} /> {formatMoney(Number(visit.fee_amount))}
            {visit.fee_status === "credited" ? " ✓" : ""}
          </span>
          {visit.items_collected > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-1.5 py-0.5 font-medium text-brand">
              <PackageCheck size={9} /> {visit.items_collected}
            </span>
          )}
        </div>

        {visit.notes && (
          <p className="mt-1.5 line-clamp-2 text-[11px] italic text-muted">“{visit.notes}”</p>
        )}
      </Link>

      <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
        {visit.contact_phone && (
          <a
            href={`tel:${visit.contact_phone}`}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[10px] text-muted transition-colors hover:border-brand hover:text-brand"
          >
            <Phone size={9} /> Call
          </a>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            disabled={pending || !prevStage}
            onClick={() => move(prevStage?.id)}
            title={prevStage ? `Back to ${prevStage.name}` : "First stage"}
            className="rounded-full border border-border p-1 text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            disabled={pending || !nextStage}
            onClick={() => move(nextStage?.id)}
            title={nextStage ? `Move to ${nextStage.name}` : "Last stage"}
            className="rounded-full bg-brand p-1 text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </article>
  );
}

/** Add, rename, reorder or retire the stages themselves. */
function StageManager({ stages, onClose }: { stages: Stage[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("");

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Pipeline stages</h2>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:text-ink">
          <X size={16} />
        </button>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        A stage can drive the visit&apos;s status — e.g. moving a card to a stage mapped to
        &ldquo;On the way&rdquo; also tells the driver app. Removing a stage moves its cards to the
        first stage; nothing is lost.
      </p>

      <ul className="mt-3 space-y-1.5">
        {stages.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
            <span className="w-5 text-xs text-muted">{i + 1}</span>
            <span className="min-w-32 flex-1 font-medium">{s.name}</span>
            <span className="text-xs text-muted">
              {s.maps_to_status ? `sets: ${s.maps_to_status.replace("_", " ")}` : "board only"}
            </span>
            {s.is_closed && (
              <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] text-muted">closed</span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button
                disabled={pending || i === 0}
                onClick={() =>
                  run(() =>
                    saveStage({
                      id: s.id,
                      name: s.name,
                      sequence: (stages[i - 1]?.sequence ?? s.sequence) - 1,
                      mapsToStatus: s.maps_to_status,
                      isClosed: s.is_closed,
                    })
                  )
                }
                title="Move earlier"
                className="rounded-full border border-border p-1 text-muted hover:text-ink disabled:opacity-30"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                disabled={pending || i === stages.length - 1}
                onClick={() =>
                  run(() =>
                    saveStage({
                      id: s.id,
                      name: s.name,
                      sequence: (stages[i + 1]?.sequence ?? s.sequence) + 1,
                      mapsToStatus: s.maps_to_status,
                      isClosed: s.is_closed,
                    })
                  )
                }
                title="Move later"
                className="rounded-full border border-border p-1 text-muted hover:text-ink disabled:opacity-30"
              >
                <ChevronRight size={12} />
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => deleteStage(s.id))}
                title="Remove stage"
                className="rounded-full border border-border p-1 text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block flex-1 basis-40">
          <span className="mb-1 block text-xs text-muted">New stage name</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Awaiting seller reply"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Sets status to</span>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button
          disabled={pending || !newName.trim()}
          onClick={() =>
            run(async () => {
              const res = await saveStage({
                id: null,
                name: newName,
                sequence: (stages[stages.length - 1]?.sequence ?? 0) + 10,
                mapsToStatus: newStatus || null,
                isClosed: false,
              });
              if (!res.error) setNewName("");
              return res;
            })
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus size={14} /> Add stage
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
