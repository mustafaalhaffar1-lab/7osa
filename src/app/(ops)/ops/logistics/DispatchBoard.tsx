"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Navigation,
  AlertTriangle,
  Users,
  MapPin,
  KeyRound,
  PackageX,
  CalendarDays,
} from "lucide-react";
import {
  JOB_TYPE,
  SLOTS,
  STAGE_LABEL,
  NEXT_STAGE,
  FAILURE_REASONS,
  directionsUrl,
  shortAddress,
  isoDate,
  type JobType,
  type JobStage,
} from "@/lib/logistics";
import { dispatchJob, advanceJob, scheduleJob } from "./actions";

export type DispatchJob = {
  id: string;
  type: JobType;
  status: JobStage;
  scheduled_date: string | null;
  slot: string | null;
  sequence: number | null;
  driver_id: string | null;
  carrier_id: string | null;
  tracking_ref: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  alt_phone: string | null;
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
  failure_reason: string | null;
  completion_notes: string | null;
  zone_id: string | null;
  items: { title: string; sku: string | null } | null;
  zones: { name: string } | null;
};

export type Assignee = { id: string; name: string; kind: "driver" | "carrier" };

const OPEN_STAGES: JobStage[] = ["unassigned", "assigned", "en_route", "arrived"];

export function DispatchBoard({
  date,
  jobs,
  drivers,
  carriers,
  zones,
  zoneFilter,
}: {
  date: string;
  jobs: DispatchJob[];
  drivers: Assignee[];
  carriers: Assignee[];
  zones: { id: string; name: string }[];
  zoneFilter: string;
}) {
  const router = useRouter();

  function goDate(offsetDays: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + offsetDays);
    router.push(`/ops/logistics?date=${isoDate(d)}${zoneFilter ? `&zone=${zoneFilter}` : ""}`);
  }

  const visible = zoneFilter ? jobs.filter((j) => j.zone_id === zoneFilter) : jobs;
  const open = visible.filter((j) => OPEN_STAGES.includes(j.status));
  const unassigned = open.filter((j) => !j.driver_id && !j.carrier_id);
  const done = visible.filter((j) => !OPEN_STAGES.includes(j.status));

  // One column per person/carrier who actually has work today.
  const assigned = open.filter((j) => j.driver_id || j.carrier_id);
  const columns = [...drivers, ...carriers]
    .map((a) => ({
      assignee: a,
      jobs: assigned.filter((j) => (a.kind === "driver" ? j.driver_id === a.id : j.carrier_id === a.id)),
    }))
    .filter((c) => c.jobs.length > 0);

  const isToday = date === isoDate(new Date());
  const pretty = new Date(date + "T12:00:00").toLocaleDateString("en-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      {/* Day header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dispatch</h1>
          <p className="mt-0.5 text-sm text-muted">
            Everything happening on one day — visits, pickups, deliveries and returns.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => goDate(-1)} aria-label="Previous day" className="rounded-full border border-border p-2 text-muted transition-colors hover:text-ink">
            <ChevronLeft size={15} />
          </button>
          <div className="min-w-52 rounded-full border border-border bg-surface px-4 py-2 text-center text-sm font-medium">
            {isToday ? "Today · " : ""}
            {pretty}
          </div>
          <button onClick={() => goDate(1)} aria-label="Next day" className="rounded-full border border-border p-2 text-muted transition-colors hover:text-ink">
            <ChevronRight size={15} />
          </button>
          {!isToday && (
            <button
              onClick={() => router.push(`/ops/logistics?date=${isoDate(new Date())}`)}
              className="rounded-full border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Day summary */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <Stat label="Jobs today" value={visible.length} />
        <Stat label="Unassigned" value={unassigned.length} tone={unassigned.length > 0 ? "warn" : undefined} />
        <Stat label="In progress" value={open.filter((j) => j.status === "en_route" || j.status === "arrived").length} />
        <Stat label="Done" value={done.filter((j) => j.status === "completed").length} />
        {done.some((j) => j.status === "failed") && (
          <Stat label="Failed" value={done.filter((j) => j.status === "failed").length} tone="bad" />
        )}
        <select
          value={zoneFilter}
          onChange={(e) =>
            router.push(`/ops/logistics?date=${date}${e.target.value ? `&zone=${e.target.value}` : ""}`)
          }
          className="ml-auto rounded-full border border-border bg-surface px-3 py-1.5 outline-none focus:border-brand"
        >
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted">
          <CalendarDays size={22} className="mx-auto mb-2 opacity-50" />
          Nothing scheduled for this day.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          {/* To assign */}
          <section className="rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">To assign</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${unassigned.length ? "bg-accent/15 text-accent" : "bg-bg text-muted"}`}>
                {unassigned.length}
              </span>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
              {unassigned.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Everything is assigned. 🎉</p>
              ) : (
                unassigned.map((j) => (
                  <JobCard key={j.id} job={j} drivers={drivers} carriers={carriers} date={date} />
                ))
              )}
            </div>
          </section>

          {/* Routes by person */}
          <section className="space-y-4">
            {columns.length === 0 && unassigned.length > 0 && (
              <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
                Nobody is assigned yet — pick someone on a job to build their route.
              </p>
            )}
            {columns.map(({ assignee, jobs: mine }) => (
              <div key={assignee.id} className="rounded-2xl border border-border bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-fg">
                      {assignee.name[0]?.toUpperCase()}
                    </span>
                    {assignee.name}
                    {assignee.kind === "carrier" && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        3rd party
                      </span>
                    )}
                  </h2>
                  <span className="text-xs text-muted">
                    {mine.length} stop{mine.length === 1 ? "" : "s"} ·{" "}
                    {SLOTS.filter((s) => mine.some((j) => j.slot === s.key))
                      .map((s) => s.label)
                      .join(", ") || "unslotted"}
                  </span>
                </div>
                <div className="space-y-3 p-3">
                  {SLOTS.map((slot) => {
                    const slotJobs = mine.filter((j) => j.slot === slot.key);
                    if (slotJobs.length === 0) return null;
                    return (
                      <div key={slot.key}>
                        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                          {slot.label} <span className="font-normal normal-case">{slot.hours}</span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        <div className="space-y-2">
                          {slotJobs.map((j) => (
                            <JobCard key={j.id} job={j} drivers={drivers} carriers={carriers} date={date} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {done.length > 0 && (
              <details className="rounded-2xl border border-border bg-surface">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                  Finished ({done.length})
                </summary>
                <div className="space-y-2 p-3 pt-0">
                  {done.map((j) => (
                    <JobCard key={j.id} job={j} drivers={drivers} carriers={carriers} date={date} />
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "bad" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        tone === "warn"
          ? "border-accent/40 bg-accent/10 text-accent"
          : tone === "bad"
            ? "border-red-500/40 bg-red-500/10 text-red-500"
            : "border-border bg-surface text-muted"
      }`}
    >
      <span className="font-bold text-ink">{value}</span> {label}
    </span>
  );
}

function JobCard({
  job,
  drivers,
  carriers,
  date,
}: {
  job: DispatchJob;
  drivers: Assignee[];
  carriers: Assignee[];
  date: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [failing, setFailing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const meta = JOB_TYPE[job.type];
  const Icon = meta.icon;
  const next = NEXT_STAGE[job.status];
  const nav = directionsUrl(job);
  const finished = job.status === "completed" || job.status === "failed";

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
    <div className={`rounded-xl border bg-bg p-3 ${finished ? "border-border opacity-70" : "border-border"}`}>
      {/* Line 1: what and where */}
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{meta.short}</span>
            {job.items?.sku && <span className="font-mono text-[10px] text-brand">{job.items.sku}</span>}
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
              {STAGE_LABEL[job.status]}
            </span>
            {job.needs_two_people && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <Users size={9} /> 2 people
              </span>
            )}
            {job.attempt_count > 0 && !finished && (
              <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
                attempt {job.attempt_count + 1}
              </span>
            )}
          </div>
          {job.items?.title && <div className="truncate text-xs text-muted">{job.items.title}</div>}
          <div className="mt-0.5 text-xs font-medium">{job.contact_name ?? "Customer"}</div>
          <div className="inline-flex items-start gap-1 text-[11px] text-muted">
            <MapPin size={10} className="mt-0.5 shrink-0" />
            <span>{shortAddress(job)}</span>
          </div>
        </div>
      </div>

      {/* Line 2: reach them / find them */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {job.contact_phone && (
          <a
            href={`tel:${job.contact_phone}`}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-brand hover:text-brand"
          >
            <Phone size={10} /> {job.contact_phone}
          </a>
        )}
        {nav && (
          <a
            href={nav}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-brand hover:text-brand"
          >
            <Navigation size={10} /> Directions
          </a>
        )}
        {job.makani && (
          <span className="rounded-full bg-bg px-2 py-1 font-mono text-[10px] text-muted">
            Makani {job.makani}
          </span>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="ml-auto text-[11px] font-medium text-brand hover:underline"
        >
          {expanded ? "Less" : "More"}
        </button>
      </div>

      {/* Access notes are the difference between a 5-minute and a 45-minute stop */}
      {job.access_notes && (
        <div className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
          <KeyRound size={11} className="mt-0.5 shrink-0" /> {job.access_notes}
        </div>
      )}

      {expanded && (
        <div className="mt-2 space-y-1 rounded-lg border border-border p-2 text-[11px] text-muted">
          {job.address && <div>Address: <span className="text-ink">{job.address}</span></div>}
          {job.zones?.name && <div>Zone: <span className="text-ink">{job.zones.name}</span></div>}
          {job.alt_phone && <div>Alt phone: <span className="text-ink">{job.alt_phone}</span></div>}
          {job.notes && <div>Customer note: <span className="text-ink">“{job.notes}”</span></div>}
          {job.tracking_ref && <div>Tracking: <span className="font-mono text-ink">{job.tracking_ref}</span></div>}
          {job.failure_reason && <div className="text-red-500">Failed: {job.failure_reason}</div>}
          {job.completion_notes && <div>Notes: <span className="text-ink">{job.completion_notes}</span></div>}
        </div>
      )}

      {/* Line 3: dispatch + move it along. One tap per decision — no dropdowns. */}
      {!finished && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-0.5 text-[10px] uppercase tracking-wide text-muted">Who</span>
            {[...drivers, ...carriers].map((a) => {
              const on = a.kind === "driver" ? job.driver_id === a.id : job.carrier_id === a.id;
              return (
                <button
                  key={a.id}
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      dispatchJob(job.id, {
                        driverId: on ? null : a.kind === "driver" ? a.id : null,
                        carrierId: on ? null : a.kind === "carrier" ? a.id : null,
                      })
                    )
                  }
                  title={on ? `Unassign ${a.name}` : `Assign to ${a.name}`}
                  className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                    on
                      ? "bg-brand text-brand-fg"
                      : a.kind === "carrier"
                        ? "border border-blue-500/40 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                        : "border border-border text-muted hover:border-brand hover:text-brand"
                  }`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-0.5 text-[10px] uppercase tracking-wide text-muted">When</span>
            {SLOTS.map((s) => (
              <button
                key={s.key}
                disabled={pending}
                onClick={() => run(() => scheduleJob(job.id, date, s.key))}
                className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                  job.slot === s.key
                    ? "bg-brand text-brand-fg"
                    : "border border-border text-muted hover:border-brand hover:text-brand"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
          {next && (
            <button
              disabled={pending}
              onClick={() => run(() => advanceJob(job.id, next.to))}
              className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "…" : next.label}
            </button>
          )}
          <button
            disabled={pending}
            onClick={() => setFailing((f) => !f)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500"
          >
            <PackageX size={10} /> Couldn&apos;t do it
          </button>
          </div>
        </div>
      )}

      {failing && (
        <div className="mt-2 rounded-lg border border-border bg-surface p-2">
          <div className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
            <AlertTriangle size={11} /> What happened?
          </div>
          <div className="flex flex-wrap gap-1">
            {FAILURE_REASONS.map((r) => (
              <button
                key={r}
                disabled={pending}
                onClick={() => run(() => advanceJob(job.id, "failed", { failureReason: r }))}
                className="rounded-full border border-border px-2 py-1 text-[10px] transition-colors hover:border-red-500 hover:text-red-500"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
