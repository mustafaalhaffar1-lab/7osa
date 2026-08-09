"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check } from "lucide-react";
import { bookVisit } from "./actions";

type Zone = { id: string; name: string };
type Slot = "morning" | "afternoon" | "evening";

const SLOTS: { key: Slot; label: string }[] = [
  { key: "morning", label: "Morning · 9–12" },
  { key: "afternoon", label: "Afternoon · 12–4" },
  { key: "evening", label: "Evening · 4–8" },
];

/** Next 14 days, starting tomorrow. */
function upcomingDates(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      value,
      label: d.toLocaleDateString("en-AE", { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return out;
}

export function VisitForm({
  zones,
  defaults,
}: {
  zones: Zone[];
  defaults?: {
    phone?: string | null;
    building?: string | null;
    unit?: string | null;
    area?: string | null;
    makani?: string | null;
    mapsUrl?: string | null;
    accessNotes?: string | null;
  };
}) {
  const router = useRouter();
  const dates = upcomingDates();
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(dates[0]?.value ?? "");
  const [slot, setSlot] = useState<Slot>("morning");
  const [notes, setNotes] = useState("");
  // Logistics detail — this is what makes the difference between finding you and not.
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [building, setBuilding] = useState(defaults?.building ?? "");
  const [unit, setUnit] = useState(defaults?.unit ?? "");
  const [area, setArea] = useState(defaults?.area ?? "");
  const [makani, setMakani] = useState(defaults?.makani ?? "");
  const [mapsUrl, setMapsUrl] = useState(defaults?.mapsUrl ?? "");
  const [accessNotes, setAccessNotes] = useState(defaults?.accessNotes ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);
    start(async () => {
      const res = await bookVisit({
        zoneId: zoneId || null,
        address,
        date,
        slot,
        notes,
        phone,
        building,
        unit,
        area,
        makani,
        mapsUrl,
        accessNotes,
      });
      if ("error" in res) setError(res.error);
      else {
        setDone(true);
        setNotes("");
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Check size={24} />
        </div>
        <h2 className="text-lg font-semibold">Visit requested</h2>
        <p className="mt-1 text-sm text-muted">
          We&apos;ll confirm your slot by SMS shortly. Have the items somewhere our agent can see them.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-4 rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:border-ink"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Area</span>
        <select
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Mobile number <span className="text-brand">*</span>
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          placeholder="05X XXX XXXX"
          className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <span className="mt-1 block text-xs text-muted">
          Our agent calls before arriving — we can&apos;t come without it.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Building / villa</span>
          <input
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="e.g. Marina Gate 2"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Apartment / villa no.</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. 1804"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Street / landmark</span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street name or nearest landmark"
          className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Makani number (optional)</span>
          <input
            value={makani}
            onChange={(e) => setMakani(e.target.value)}
            inputMode="numeric"
            placeholder="10 digits"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <span className="mt-1 block text-xs text-muted">On your building entrance plate.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Google Maps pin (optional)</span>
          <input
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="Paste a maps link"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <span className="mt-1 block text-xs text-muted">The fastest way to find you.</span>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Parking &amp; access (optional)</span>
        <input
          value={accessNotes}
          onChange={(e) => setAccessNotes(e.target.value)}
          placeholder="e.g. Visitor parking P2, use service lift, security needs ID"
          className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Date</span>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => setDate(d.value)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                date === d.value ? "border-brand bg-brand text-brand-fg" : "border-border text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Time slot</span>
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSlot(s.key)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                slot === s.key ? "border-brand bg-brand text-brand-fg" : "border-border text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">What should we expect? (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="e.g. a dining table, two lamps, a coffee machine — moving out end of the month"
          className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || !address.trim() || !date}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <CalendarCheck size={16} />
        {pending ? "Booking…" : "Request this visit"}
      </button>
      <p className="text-center text-xs text-muted">
        No charge today — we confirm your slot first.
      </p>
    </div>
  );
}
