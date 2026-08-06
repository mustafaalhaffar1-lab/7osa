"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Sparkles } from "lucide-react";
import { CONDITION_GRADES, type ConditionGrade } from "@/lib/domain/enums";
import { estimateValue } from "@/lib/domain/valuation";
import { calcCommission } from "@/lib/domain/commission";
import { formatMoney } from "@/lib/format";
import { addItemFromVisit } from "../../admin-actions";

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

/** On-site intake: the agent logs each item they're taking, right at the seller's door. */
export function CollectPanel({ visitId, categories }: { visitId: string; categories: Category[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [condition, setCondition] = useState<ConditionGrade>("good");
  const [retail, setRetail] = useState("");
  const [sellerMin, setSellerMin] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  // Instant on-the-doorstep valuation so the agent can quote the seller face to face.
  const est = estimateValue({
    category: categoryName,
    conditionGrade: condition,
    brand,
    retailPrice: num(retail) ?? undefined,
  });
  let payout: string | null = null;
  try {
    const mid = Math.round((est.estimateMin + est.estimateMax) / 2);
    payout = formatMoney(calcCommission(mid).sellerPayout);
  } catch {
    payout = null;
  }

  function submit() {
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
      });
      if (res?.error) setError(res.error);
      else {
        setNotice(`${title} added to the inspection queue.`);
        setTitle("");
        setBrand("");
        setRetail("");
        setSellerMin("");
        router.refresh();
      }
    });
  }

  return (
    <section className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <PackagePlus size={16} className="text-brand" /> Add a collected item
      </h2>
      <p className="mt-0.5 text-xs text-muted">
        Logs it under this seller, already in our hands, ready for inspection.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="What is it?">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Espresso machine"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="Condition">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ConditionGrade)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
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
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
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
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Field>
          <Field label="Seller's minimum">
            <input
              value={sellerMin}
              onChange={(e) => setSellerMin(e.target.value)}
              inputMode="numeric"
              placeholder="Optional"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Field>
        </div>

        {/* Doorstep quote */}
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
            <Sparkles size={12} /> Estimated
          </div>
          <div className="mt-0.5 text-sm font-bold">
            {formatMoney(est.estimateMin)} – {formatMoney(est.estimateMax)}
          </div>
          {payout && <div className="text-[11px] text-muted">Seller gets about {payout}</div>}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {notice && <p className="text-xs text-brand">{notice}</p>}

        <button
          onClick={submit}
          disabled={pending || !title.trim()}
          className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Adding…" : "Add item"}
        </button>
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
