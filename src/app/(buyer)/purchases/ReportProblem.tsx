"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { reportProblem } from "./actions";

const REASONS = [
  { key: "damaged_in_delivery", label: "Damaged during delivery" },
  { key: "not_as_described", label: "Not as described" },
  { key: "missing_parts", label: "Missing parts or accessories" },
  { key: "faulty", label: "Doesn't work" },
  { key: "other", label: "Something else" },
];

/**
 * Buyers report a problem inside the return window. Warehouse pickups are sold as seen,
 * so the server refuses those — we surface whatever it says rather than guessing here.
 */
export function ReportProblem({
  orderId,
  daysLeft,
  existingStatus,
}: {
  orderId: string;
  daysLeft: number | null;
  existingStatus: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].key);
  const [desc, setDesc] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (existingStatus) {
    const label =
      existingStatus === "requested"
        ? "Return under review"
        : existingStatus === "approved"
          ? "Return approved — we'll collect it"
          : existingStatus === "rejected"
            ? "Return declined"
            : "Return closed";
    return <span className="text-xs font-medium text-accent">{label}</span>;
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
        <CheckCircle2 size={13} /> Reported — we&apos;ll be in touch
      </span>
    );
  }

  if (daysLeft == null) return null;

  function submit() {
    setError(null);
    start(async () => {
      const res = await reportProblem(orderId, reason, desc);
      if (res.error) setError(res.error);
      else {
        setDone(true);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        <ShieldAlert size={13} /> Report a problem
        <span className="text-[11px] text-muted">
          ({daysLeft} day{daysLeft === 1 ? "" : "s"} left)
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-bg p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">What went wrong?</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {REASONS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Tell us more (optional)</span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={pending}
            className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Submit report"}
          </button>
        </div>
      )}
    </div>
  );
}
