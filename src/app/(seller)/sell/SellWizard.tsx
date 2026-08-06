"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, PackageCheck, Home, Ban } from "lucide-react";
import { CONDITION_GRADES, type ConditionGrade } from "@/lib/domain/enums";
import type { PossessionMode } from "@/lib/domain/item-state";
import { estimateValue } from "@/lib/domain/valuation";
import { assessIntake, type IntakeLimits } from "@/lib/domain/intake";
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

export function SellWizard({
  categories,
  zones,
  limits,
}: {
  categories: Category[];
  zones: Zone[];
  limits?: IntakeLimits;
}) {
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
  const [sellerTarget, setSellerTarget] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [custodyChoice, setCustody] = useState<PossessionMode | null>(null);
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
    const decision = assessIntake(
      {
        estimatedValueMin: valuation.estimateMin,
        estimatedValueMax: valuation.estimateMax,
        weightKg: num(weight) ?? undefined,
        longestSideCm: num(side) ?? undefined,
      },
      limits
    );
    let payoutLow: number | null = null;
    let payoutHigh: number | null = null;
    if (decision.route === "concierge") {
      try {
        payoutLow = calcCommission(valuation.estimateMin).sellerPayout;
        payoutHigh = calcCommission(valuation.estimateMax).sellerPayout;
      } catch {
        payoutLow = payoutHigh = null;
      }
    }
    return { valuation, decision, payoutLow, payoutHigh };
  }, [categoryName, condition, brand, retail, weight, side, limits]);

  // Seller can override our custody recommendation ("keep it until it sells").
  const custody: PossessionMode = custodyChoice ?? quote.decision.possession ?? "warehouse";

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
      possession: custody,
      weightKg: num(weight),
      longestSideCm: num(side),
      estimateMin: quote.valuation.estimateMin,
      estimateMax: quote.valuation.estimateMax,
      confidence: quote.valuation.confidence,
      retailPrice: num(retail),
      sellerMinPrice: num(sellerMin),
      sellerTargetPrice: num(sellerTarget),
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
    <div className="px-4 py-6 sm:px-6">
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
            <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
              {/* Pick your starting price from the suggested range — payout updates live */}
              <PricePicker
                min={quote.valuation.estimateMin}
                max={quote.valuation.estimateMax}
                value={sellerTarget}
                onChange={setSellerTarget}
              />

              <Text label="Your minimum price, AED (we never sell below this)" value={sellerMin}
                onChange={setSellerMin} placeholder={String(quote.valuation.estimateMin)} inputMode="numeric" />

              {/* Custody choice — collect now, or keep it until it sells */}
              <div>
                <span className="mb-1.5 block text-sm font-medium">How should we handle it?</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <CustodyOption
                    active={custody === "warehouse"}
                    onClick={() => setCustody("warehouse")}
                    title="Collect it now"
                    body="We pick it up, store, and ship it the moment it sells — fastest delivery for buyers."
                  />
                  <CustodyOption
                    active={custody === "in_place"}
                    onClick={() => setCustody("in_place")}
                    title="Keep it until it sells"
                    body="Stays at your place. We only collect once someone buys it."
                  />
                </div>
              </div>

              <Select label={custody === "warehouse" ? "Pickup zone" : "Your area"} value={zoneId} onChange={setZoneId}
                options={zones.map((z) => ({ value: z.id, label: z.name }))} />
              <Text label={custody === "warehouse" ? "Pickup address" : "Your address"} value={address} onChange={setAddress} placeholder="Building, area" />

              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Creating…" : (
                  <>
                    <Check size={16} />
                    {custody === "warehouse" ? "Confirm & book pickup" : "Confirm listing"}
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
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

/** Pick a starting price inside the suggested range; payout updates live. */
function PricePicker({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const mid = Math.round((min + max) / 2);
  const current = num(value) ?? mid;
  const clamped = Math.min(Math.max(current, min), max);
  let payout: number | null = null;
  try {
    payout = calcCommission(clamped).sellerPayout;
  } catch {
    payout = null;
  }
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 50;
  const speed = pct <= 33 ? "Sells fastest" : pct <= 66 ? "Balanced" : "Highest return, slower";

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">Choose your starting price</span>
      <div className="rounded-2xl border border-border bg-bg p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{formatMoney(clamped)}</div>
          <div className="text-right">
            <div className="text-sm font-semibold text-brand">
              {payout != null ? `You get ${formatMoney(payout)}` : "—"}
            </div>
            <div className="text-[11px] text-muted">after our commission</div>
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={clamped}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 w-full accent-[rgb(var(--brand))]"
        />
        <div className="flex justify-between text-[11px] text-muted">
          <span>{formatMoney(min)}</span>
          <span className="font-medium text-ink">{speed}</span>
          <span>{formatMoney(max)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Our suggested range is based on the item, its condition, and what similar things sell for.
          You can pick anywhere in it.
        </p>
      </div>
    </div>
  );
}

function CustodyOption({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${
        active ? "border-brand bg-brand/5" : "border-border hover:border-ink"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {active ? <PackageCheck size={15} className="text-brand" /> : <Home size={15} className="text-muted" />}
        {title}
      </div>
      <p className="mt-1 text-xs text-muted">{body}</p>
    </button>
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
