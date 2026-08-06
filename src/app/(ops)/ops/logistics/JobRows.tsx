"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Truck, PackageCheck, MapPin } from "lucide-react";
import { assignJob, setJobStatus } from "../admin-actions";

export type AdminJob = {
  id: string;
  type: "pickup_intake" | "pickup_on_sale" | "delivery";
  status: "unassigned" | "assigned" | "en_route" | "completed" | "failed";
  address: string | null;
  scheduled_from: string | null;
  scheduled_to: string | null;
  driver_id: string | null;
  created_at: string;
  items: { title: string; sku: string | null; seller_address: string | null } | null;
  zones: { name: string } | null;
};

export type DriverOption = { id: string; name: string };

const TYPE_LABEL: Record<AdminJob["type"], string> = {
  pickup_intake: "Pickup — intake",
  pickup_on_sale: "Pickup — sold item",
  delivery: "Delivery to buyer",
};

const NEXT: Partial<Record<AdminJob["status"], { to: AdminJob["status"]; label: string }>> = {
  assigned: { to: "en_route", label: "Start route" },
  en_route: { to: "completed", label: "Mark done" },
};

const OPEN = new Set(["unassigned", "assigned", "en_route"]);

export function JobRows({ jobs, drivers }: { jobs: AdminJob[]; drivers: DriverOption[] }) {
  const open = jobs.filter((j) => OPEN.has(j.status));
  const done = jobs.filter((j) => !OPEN.has(j.status));

  if (jobs.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        No jobs yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Open ({open.length})</h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            All clear.
          </p>
        ) : (
          <ul className="space-y-2">{open.map((j) => <Row key={j.id} job={j} drivers={drivers} />)}</ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Completed</h2>
          <ul className="space-y-2">{done.map((j) => <Row key={j.id} job={j} drivers={drivers} />)}</ul>
        </section>
      )}
    </div>
  );
}

function Row({ job, drivers }: { job: AdminJob; drivers: DriverOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = NEXT[job.status];
  const isDelivery = job.type === "delivery";
  const address = job.address || job.items?.seller_address || job.zones?.name || "—";

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDelivery ? "bg-accent/10 text-accent" : "bg-brand/10 text-brand"}`}>
          {isDelivery ? <Truck size={17} /> : <PackageCheck size={17} />}
        </div>

        <div className="min-w-0 flex-1 basis-56">
          <div className="text-sm font-medium">
            {TYPE_LABEL[job.type]}
            {job.items?.sku && <span className="ml-2 font-mono text-[11px] text-brand">{job.items.sku}</span>}
          </div>
          <div className="truncate text-xs text-muted">{job.items?.title ?? "Item"}</div>
          <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
            <MapPin size={11} /> {address}
            {job.scheduled_from && (
              <span>
                {" "}· {new Date(job.scheduled_from).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>

        {/* Assign a driver */}
        <select
          disabled={pending}
          value={job.driver_id ?? ""}
          onChange={(e) => e.target.value && run(() => assignJob(job.id, e.target.value))}
          className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-brand"
        >
          <option value="">Unassigned</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] capitalize text-muted">
          {job.status.replace("_", " ")}
        </span>

        {next && (
          <button
            disabled={pending}
            onClick={() => run(() => setJobStatus(job.id, next.to))}
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "…" : next.label}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}
