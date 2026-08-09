"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Sparkles, Camera, X, Send, CheckCircle2 } from "lucide-react";
import { CONDITION_GRADES, type ConditionGrade } from "@/lib/domain/enums";
import { estimateValue } from "@/lib/domain/valuation";
import { calcCommission } from "@/lib/domain/commission";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { addItemFromVisit, submitVisitReport } from "../../admin-actions";

type Category = { id: string; name: string };

const CONDITION_LABEL: Record<ConditionGrade, string> = {
  new: "New",
  like_new: "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

function num(v: string): number | null {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * The agent's collection sheet, used at the seller's door: log each item with photos,
 * then submit one report that closes the visit and sends the batch to the warehouse.
 */
export function CollectPanel({
  visitId,
  categories,
  collectedCount,
  submitted,
}: {
  visitId: string;
  categories: Category[];
  collectedCount: number;
  submitted: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [condition, setCondition] = useState<ConditionGrade>("good");
  const [retail, setRetail] = useState("");
  const [sellerMin, setSellerMin] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Report
  const [summary, setSummary] = useState("");
  const [declined, setDeclined] = useState("");
  const [reporting, setReporting] = useState(false);

  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const est = estimateValue({
    category: categoryName,
    conditionGrade: condition,
    brand,
    retailPrice: num(retail) ?? undefined,
  });
  let payout: string | null = null;
  try {
    payout = formatMoney(calcCommission(Math.round((est.estimateMin + est.estimateMax) / 2)).sellerPayout);
  } catch {
    payout = null;
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `field/${visitId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("item-photos").upload(path, file);
      if (upErr) setError(upErr.message);
      else urls.push(supabase.storage.from("item-photos").getPublicUrl(path).data.publicUrl);
    }
    setPhotos((p) => [...p, ...urls]);
    setUploading(false);
  }

  function addItem() {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await addItemFromVisit({
        visitId,
        title,
        categoryId: categoryId || null,
        brand,
        condition,
        estimateMin: est.estimateMin,
        estimateMax: est.estimateMax,
        sellerMinPrice: num(sellerMin),
        retailPrice: num(retail),
        photoUrls: photos,
        notes,
      });
      if (res?.error) setError(res.error);
      else {
        setNotice(`${title} added — ${photos.length} photo${photos.length === 1 ? "" : "s"}.`);
        setTitle("");
        setBrand("");
        setRetail("");
        setSellerMin("");
        setNotes("");
        setPhotos([]);
        router.refresh();
      }
    });
  }

  function submitReport() {
    setError(null);
    start(async () => {
      const res = await submitVisitReport(visitId, summary, declined);
      if (res?.error) setError(res.error);
      else {
        setReporting(false);
        router.refresh();
      }
    });
  }

  if (submitted) {
    return (
      <section className="h-fit rounded-2xl border border-brand bg-brand/5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand">
          <CheckCircle2 size={16} /> Report submitted
        </div>
        <p className="mt-1 text-xs text-muted">
          {collectedCount} item{collectedCount === 1 ? "" : "s"} handed to the warehouse for
          inspection, photography and barcoding.
        </p>
      </section>
    );
  }

  return (
    <section className="h-fit space-y-4">
      {/* Add an item */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <PackagePlus size={16} className="text-brand" /> Add a collected item
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Photograph it as it looks now — the studio shots happen later.
        </p>

        <div className="mt-4 space-y-3">
          {/* Photos first: that's the order the agent actually works in */}
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">Photos</span>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))}
                    aria-label="Remove photo"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-border text-muted transition-colors hover:border-brand hover:text-brand">
                <Camera size={16} />
                <span className="text-[9px]">{uploading ? "…" : "Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => upload(e.target.files)}
                />
              </label>
            </div>
          </div>

          <Field label="What is it?">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Espresso machine"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
            <Field label="Condition">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ConditionGrade)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                {CONDITION_GRADES.map((g) => (
                  <option key={g} value={g}>{CONDITION_LABEL[g]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Retail price (AED)">
              <input
                value={retail}
                onChange={(e) => setRetail(e.target.value)}
                inputMode="numeric"
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
            <Field label="Seller's minimum">
              <input
                value={sellerMin}
                onChange={(e) => setSellerMin(e.target.value)}
                inputMode="numeric"
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
          </div>

          <Field label="Notes for the warehouse">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. small chip on the lid, missing remote"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>

          <div className="rounded-xl border border-brand/30 bg-brand/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
              <Sparkles size={12} /> Quote for the seller
            </div>
            <div className="mt-0.5 text-sm font-bold">
              {formatMoney(est.estimateMin)} – {formatMoney(est.estimateMax)}
            </div>
            {payout && <div className="text-[11px] text-muted">They&apos;d get about {payout}</div>}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {notice && <p className="text-xs text-brand">{notice}</p>}

          <button
            onClick={addItem}
            disabled={pending || uploading || !title.trim()}
            className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "Adding…" : "Add this item"}
          </button>
        </div>
      </div>

      {/* Finish the visit */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold">Finish the visit</h2>
        <p className="mt-0.5 text-xs text-muted">
          Submitting hands {collectedCount} item{collectedCount === 1 ? "" : "s"} to the warehouse
          and closes the job.
        </p>

        {!reporting ? (
          <button
            onClick={() => setReporting(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            <Send size={14} /> Write the report
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <Field label="How did it go?">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="e.g. Collected 3 of 5 items, seller happy with the quotes"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
            <Field label="Anything you turned down, and why?">
              <textarea
                value={declined}
                onChange={(e) => setDeclined(e.target.value)}
                rows={2}
                placeholder="e.g. Sofa too large for the van; TV screen cracked"
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={submitReport}
                disabled={pending}
                className="flex-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Submit report"}
              </button>
              <button
                onClick={() => setReporting(false)}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
