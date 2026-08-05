"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, PackageCheck, Home, Ban } from "lucide-react";
import { CONDITION_GRADES, type ConditionGrade } from "@/lib/domain/enums";
import { estimateValue } from "@/lib/domain/valuation";
import { assessIntake } from "@/lib/domain/intake";
import { calcCommission } from "@/lib/domain/commission";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { createListing } from "./actions";

type Category = { id: string; name: string; possession_default: string };
type Zone = { id: string; name: string };
type Quote = {
  valuation: ReturnType<typeof estimateValue>;
  decision: ReturnType<typeof assessIntake>;
  payoutLow: number | null;
  payoutHigh: number | null;
};

const CONDITION_LABEL: Record<ConditionGrade, string> = {
  new: "New (unused)",
  like_new: "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

function num(v: string): number | null {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function SellWizard({ categories, zones }: { categories: Category[]; zones: Zone[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // form state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [condition, setCondition] = useState<ConditionGrade>("excellent");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [retail, setRetail] = useState("");
  const [weight, setWeight] = useState("");
  const [side, setSide] = useState("");
  const [sellerMin, setSellerMin] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  // Live quote — pure, tested domain logic. No server round-trip.
  const quote = useMemo(() => {
    const valuation = estimateValue({
      category: categoryName,
      conditionGrade: condition,
      brand,
      retailPrice: num(retail) ?? undefined,
    });
    const decision = assessIntake({
      estimatedValueMin: valuation.estimateMin,
      estimatedValueMax: valuation.estimateMax,
      weightKg: num(weight) ?? undefined,
      longestSideCm: num(side) ?? undefined,
    });
    let payoutLow: number | null = null;
    let payoutHigh: number | null = null;
    if (decision.route === "concierge") {
      payoutLow = calcCommission(valuation.estimateMin).sellerPayout;
      payoutHigh = calcCommission(valuation.estimateMax).sellerPayout;
    }
    return { valuation, decision, payoutLow, payoutHigh };
  }, [categoryName, condition, brand, retail, weight, side]);

  async function handlePhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `intake/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("item-photos").upload(path, file);
      if (!upErr) {
        urls.push(supabase.storage.from("item-photos").getPublicUrl(path).data.publicUrl);
      }
    }
    setPhotoUrls((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await createListing({
      title,
      categoryId: categoryId || null,
      brand,
      model,
      condition,
      possession: quote.decision.possession ?? "warehouse",
      weightKg: num(weight),
      longestSideCm: num(side),
      estimateMin: quote.valuation.estimateMin,
      estimateMax: quote.valuation.estimateMax,
      confidence: quote.valuation.confidence,
      retailPrice: num(retail),
      sellerMinPrice: num(sellerMin),
      zoneId: zoneId || null,
      address,
      photoUrls,
    });
    if ("error" in res) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    router.push("/my-items");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Steps step={step} />

      {step === 1 && (
        <section className="mt-8 space-y-5">
          <h1 className="text-2xl font-semibold tracking-tight">What are you selling?</h1>
          <Text label="Title" value={title} onChange={setTitle} placeholder="e.g. Dyson V11 vacuum" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" value={categoryId} onChange={setCategoryId}
              options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            <Select label="Condition" value={condition} onChange={(v) => setCondition(v as ConditionGrade)}
              options={CONDITION_GRADES.map((g) => ({ value: g, label: CONDITION_LABEL[g] }))} />
            <Text label="Brand (optional)" value={brand} onChange={setBrand} placeholder="Dyson" />
            <Text label="Model (optional)" value={model} onChange={setModel} placeholder="V11" />
            <Text label="Original price, AED (optional)" value={retail} onChange={setRetail} placeholder="2400" inputMode="numeric" />
            <div />
            <Text label="Weight, kg (optional)" value={weight} onChange={setWeight} placeholder="3" inputMode="numeric" />
            <Text label="Longest side, cm (optional)" value={side} onChange={setSide} placeholder="40" inputMode="numeric" />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Photos (optional)</span>
            <input type="file" accept="image/*" multiple onChange={(e) => handlePhotos(e.target.files)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-brand" />
            {uploading && <p className="mt-2 text-sm text-muted">Uploading…</p>}
            {photoUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photoUrls.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>

          <button
            disabled={!title || !categoryId}
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Get my quote <ArrowRight size={16} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 space-y-6">
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft size={15} /> Edit details
          </button>

          <QuoteCard quote={quote} title={title} />

          {quote.decision.route === "concierge" && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
              <Text label="Your minimum price, AED (we never sell below this)" value={sellerMin}
                onChange={setSellerMin} placeholder={String(quote.valuation.estimateMin)} inputMode="numeric" />
              <Select label="Pickup zone" value={zoneId} onChange={setZoneId}
                options={zones.map((z) => ({ value: z.id, label: z.name }))} />
              <Text label="Pickup address" value={address} onChange={setAddress} placeholder="Building, area" />

              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Creating…" : (
                  <>
                    <Check size={16} />
                    {quote.decision.possession === "warehouse" ? "Confirm & book pickup" : "Confirm listing"}
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function QuoteCard({ quote, title }: { quote: Quote; title: string }) {
  const { valuation, decision, payoutLow, payoutHigh } = quote;

  if (decision.route === "declined") {
    return (
      <Banner icon={<Ban size={18} />} tone="red" heading="Just outside our launch scope">
        {decision.reasons.join(" ")} We&apos;re starting with items one driver can handle — no oversized
        furniture yet. Everything else in the home is welcome.
      </Banner>
    );
  }
  if (decision.route === "self_serve") {
    return (
      <Banner icon={<Ban size={18} />} tone="amber" heading="Better as a quick self-serve listing">
        This looks to be under our AED 500 concierge threshold, so our full-service handling would eat
        the value. A lighter self-serve option is coming soon.
      </Banner>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="text-sm text-muted">Estimated sale price for &ldquo;{title}&rdquo;</div>
      <div className="mt-1 text-3xl font-semibold">
        {formatMoney(valuation.estimateMin)} – {formatMoney(valuation.estimateMax)}
      </div>
      <p className="mt-2 text-sm text-muted">{valuation.basis}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-brand">
            {decision.possession === "warehouse" ? <PackageCheck size={15} /> : <Home size={15} />}
            {decision.possession === "warehouse" ? "We collect it now" : "Stays home until it sells"}
          </div>
          <p className="text-sm text-muted">
            {decision.possession === "warehouse"
              ? "Small enough for our studio — faster delivery and a quality guarantee."
              : "We list it in place and collect only once it sells — no storage limbo."}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="mb-1 text-sm font-medium text-brand">You receive</div>
          <div className="text-2xl font-semibold">
            {payoutLow != null && payoutHigh != null
              ? `${formatMoney(payoutLow)} – ${formatMoney(payoutHigh)}`
              : "—"}
          </div>
          <p className="text-sm text-muted">after our commission, on sale.</p>
        </div>
      </div>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={step === 1 ? "font-medium text-ink" : "text-muted"}>1. Details</span>
      <span className="h-px w-8 bg-border" />
      <span className={step === 2 ? "font-medium text-ink" : "text-muted"}>2. Quote & confirm</span>
    </div>
  );
}

function Banner({ icon, tone, heading, children }: {
  icon: React.ReactNode; tone: "red" | "amber"; heading: string; children: React.ReactNode;
}) {
  const c = tone === "red" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400";
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className={`mb-2 flex items-center gap-2 font-medium ${c}`}>{icon}{heading}</div>
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

function Text({ label, value, onChange, placeholder, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none transition-colors focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
