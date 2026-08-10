"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { CONDITION_GRADES, type ConditionGrade } from "@/lib/domain/enums";
import { BRAND } from "@/lib/brand";
import { opsInspect } from "../../../actions";

const CONDITION_LABEL: Record<ConditionGrade, string> = {
  new: "New",
  like_new: "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

export type InspectionRecord = {
  condition_grade: string | null;
  functional_test_passed: boolean | null;
  data_wipe_certified: boolean | null;
  notes: string | null;
  created_at: string;
  inspector: string | null;
};

/**
 * The inspection is the promise behind every listing — "we checked it, it works".
 * It belongs on the product record, permanently, not buried in a workflow board.
 */
export function InspectionPanel({
  itemId,
  status,
  inspection,
}: {
  itemId: string;
  status: string;
  inspection: InspectionRecord | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<ConditionGrade>(
    (inspection?.condition_grade as ConditionGrade) ?? "good"
  );
  const [functional, setFunctional] = useState(inspection?.functional_test_passed ?? true);
  const [dataWipe, setDataWipe] = useState(inspection?.data_wipe_certified ?? false);
  const [notes, setNotes] = useState(inspection?.notes ?? "");

  function save() {
    setError(null);
    start(async () => {
      const res = await opsInspect(itemId, { condition, functional, dataWipe, notes });
      if (res?.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  const canInspect = ["received", "collected", "inspected", "accepted"].includes(status);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardCheck size={15} className="text-brand" /> Inspection
        </h2>
        {canInspect && !open && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
          >
            {inspection ? "Re-inspect" : "Record inspection"}
          </button>
        )}
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Condition grade</span>
            <div className="flex flex-wrap gap-1.5">
              {CONDITION_GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setCondition(g)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    condition === g
                      ? "border-brand bg-brand text-brand-fg"
                      : "border-border text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {CONDITION_LABEL[g]}
                </button>
              ))}
            </div>
          </label>

          <Toggle
            checked={functional}
            onChange={() => setFunctional((v) => !v)}
            label="Powers on and works as intended"
            hint="We say this on the listing — only tick it if you tested it."
          />
          <Toggle
            checked={dataWipe}
            onChange={() => setDataWipe((v) => !v)}
            label="Factory reset / data wiped"
            hint="Required for anything that stores personal data."
          />

          <label className="block">
            <span className="mb-1 block text-xs text-muted">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Small scuff on the left corner, all accessories present"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={pending}
              className="flex-1 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save inspection"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : inspection ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {inspection.condition_grade && (
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                {CONDITION_LABEL[inspection.condition_grade as ConditionGrade] ?? inspection.condition_grade}
              </span>
            )}
            <Badge ok={inspection.functional_test_passed} yes="Works" no="Fault found" />
            {inspection.data_wipe_certified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                <ShieldCheck size={11} /> Data wiped
              </span>
            )}
          </div>
          {inspection.notes && <p className="text-xs leading-relaxed text-muted">{inspection.notes}</p>}
          <p className="text-[11px] text-muted">
            {inspection.inspector ? `${inspection.inspector} · ` : ""}
            {new Date(inspection.created_at).toLocaleString(BRAND.locale, {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Not inspected yet.{" "}
          {canInspect
            ? "Record one before this goes on sale."
            : "It'll be checked once it reaches the studio."}
        </p>
      )}
    </div>
  );
}

function Badge({ ok, yes, no }: { ok: boolean | null; yes: string; no: string }) {
  if (ok == null) return null;
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
      <CheckCircle2 size={11} /> {yes}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500">
      <XCircle size={11} /> {no}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onChange}
      className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        checked ? "border-brand bg-brand/5" : "border-border bg-bg"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          checked ? "border-brand bg-brand text-brand-fg" : "border-border"
        }`}
      >
        {checked && <CheckCircle2 size={11} />}
      </span>
      <span>
        <span className="block text-xs font-medium">{label}</span>
        <span className="block text-[11px] text-muted">{hint}</span>
      </span>
    </button>
  );
}
