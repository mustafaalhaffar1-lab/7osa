"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  Navigation,
  KeyRound,
  Users,
  CheckCircle2,
  PackageX,
  AlertTriangle,
  PartyPopper,
  ClipboardList,
} from "lucide-react";
import {
  JOB_TYPE,
  SLOTS,
  STAGE_LABEL,
  NEXT_STAGE,
  FAILURE_REASONS,
  directionsUrl,
  shortAddress,
  type JobType,
  type JobStage,
} from "@/lib/logistics";
import { advanceJob } from "@/app/(ops)/ops/logistics/actions";

export type DriverJob = {
  id: string;
  type: JobType;
  status: JobStage;
  slot: string | null;
  sequence: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  address: string | null;
  building: string | null;
  unit: string | null;
  area: string | null;
  makani: string | null;
  maps_url: string | null;
  access_notes: string | null;
  notes: string | null;
  needs_two_people: boolean;
  attempt_count: number;
  visit_id: string | null;
  items: { title: string; sku: string | null } | null;
};

const DONE: JobStage[] = ["completed", "failed"];

/** Mobile-first field view: big targets, one job at a time, nothing to hunt for. */
export function DriverDay({ jobs }: { jobs: DriverJob[] }) {
  const open = jobs.filter((j) => !DONE.includes(j.status));
  const done = jobs.filter((j) => DONE.includes(j.status));

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center">
        <ClipboardList size={26} className="mx-auto mb-2 text-muted opacity-50" />
        <p className="text-sm text-muted">Nothing assigned to you today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-full bg-brand px-3 py-1 font-semibold text-brand-fg">
          {open.length} left
        </span>
        <span className="text-muted">{done.length} done</span>
      </div>

      {open.length === 0 ? (
        <div className="rounded-2xl border border-brand bg-brand/5 px-4 py-10 text-center">
          <PartyPopper size={26} className="mx-auto mb-2 text-brand" />
          <p className="text-sm font-medium">That&apos;s your day finished. Nice work.</p>
        </div>
      ) : (
        SLOTS.map((slot) => {
          const slotJobs = open.filter((j) => j.slot === slot.key);
          if (slotJobs.length === 0) return null;
          return (
            <section key={slot.key}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {slot.label} <span className="font-normal normal-case">{slot.hours}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {slotJobs.map((j) => (
                  <DriverCard key={j.id} job={j} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {done.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-muted">
            Finished ({done.length})
          </summary>
          <div className="mt-2 space-y-2">
            {done.map((j) => (
              <div key={j.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm opacity-70">
                {j.status === "completed" ? (
                  <CheckCircle2 size={14} className="text-brand" />
                ) : (
                  <PackageX size={14} className="text-red-500" />
                )}
                <span className="truncate">{JOB_TYPE[j.type].short} · {shortAddress(j)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function DriverCard({ job }: { job: DriverJob }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [failing, setFailing] = useState(false);

  const meta = JOB_TYPE[job.type];
  const Icon = meta.icon;
  const next = NEXT_STAGE[job.status];
  const nav = directionsUrl(job);
  const live = job.status === "en_route" || job.status === "arrived";

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setFailing(false);
        router.refresh();
      }
    });
  }

  return (
    <div className={`rounded-2xl border bg-surface p-4 shadow-card ${live ? "border-brand" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{meta.label}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
              {STAGE_LABEL[job.status]}
            </span>
          </div>
          {job.items?.title && (
            <div className="truncate text-sm text-muted">
              {job.items.title}
              {job.items.sku ? ` · ${job.items.sku}` : ""}
            </div>
          )}
          <div className="mt-1 font-medium">{job.contact_name ?? "Customer"}</div>
          <div className="text-sm text-muted">{shortAddress(job)}</div>
          {job.makani && <div className="font-mono text-xs text-muted">Makani {job.makani}</div>}
        </div>
      </div>

      {/* Warnings the driver must see before setting off */}
      {(job.needs_two_people || job.attempt_count > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.needs_two_people && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Users size={11} /> Bring a second person
            </span>
          )}
          {job.attempt_count > 0 && (
            <span className="rounded-full bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500">
              Attempt {job.attempt_count + 1}
            </span>
          )}
        </div>
      )}

      {job.access_notes && (
        <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <KeyRound size={12} className="mt-0.5 shrink-0" /> {job.access_notes}
        </div>
      )}
      {job.notes && <p className="mt-2 text-xs italic text-muted">“{job.notes}”</p>}

      {/* Big, thumb-friendly actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={job.contact_phone ? `tel:${job.contact_phone}` : undefined}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium transition-colors ${
            job.contact_phone ? "hover:border-brand hover:text-brand" : "pointer-events-none opacity-40"
          }`}
        >
          <Phone size={15} /> Call
        </a>
        <a
          href={nav ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium transition-colors ${
            nav ? "hover:border-brand hover:text-brand" : "pointer-events-none opacity-40"
          }`}
        >
          <Navigation size={15} /> Navigate
        </a>
      </div>

      {/* Visits open the on-site collection screen */}
      {job.visit_id && job.status === "arrived" && (
        <Link
          href={`/ops/visits/${job.visit_id}`}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-brand bg-brand/5 py-3 text-sm font-semibold text-brand"
        >
          <ClipboardList size={15} /> Log the items I&apos;m taking
        </Link>
      )}

      {next && (
        <button
          onClick={() => run(() => advanceJob(job.id, next.to))}
          disabled={pending}
          className="mt-2 w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "…" : next.label}
        </button>
      )}

      <button
        onClick={() => setFailing((f) => !f)}
        disabled={pending}
        className="mt-2 w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500"
      >
        Couldn&apos;t complete this
      </button>

      {failing && (
        <div className="mt-2 rounded-xl border border-border p-2">
          <div className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted">
            <AlertTriangle size={12} /> Why?
          </div>
          <div className="grid gap-1.5">
            {FAILURE_REASONS.map((r) => (
              <button
                key={r}
                disabled={pending}
                onClick={() => run(() => advanceJob(job.id, "failed", { failureReason: r }))}
                className="rounded-lg border border-border px-3 py-2.5 text-left text-xs transition-colors hover:border-red-500 hover:text-red-500"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
