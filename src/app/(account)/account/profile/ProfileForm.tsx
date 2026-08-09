"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { updateProfile } from "./actions";

type Fields = {
  fullName: string;
  phone: string;
  building: string;
  unit: string;
  area: string;
  makani: string;
  mapsUrl: string;
  accessNotes: string;
};

export function ProfileForm({ email, initial }: { email: string; initial: Fields }) {
  const router = useRouter();
  const [f, setF] = useState<Fields>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof Fields) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  function save() {
    setError(null);
    start(async () => {
      const res = await updateProfile(f);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">About you</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={f.fullName} onChange={set("fullName")} placeholder="Your name" />
          <Field
            label="Mobile number"
            value={f.phone}
            onChange={set("phone")}
            placeholder="05X XXX XXXX"
            type="tel"
            hint="We call before every pickup or delivery."
          />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-muted">
          <Mail size={14} /> {email}
          <span className="ml-auto text-xs">Sign-in email</span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Your address</h2>
        <p className="mt-0.5 text-xs text-muted">
          Used for pickups and deliveries — the better this is, the faster we find you.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Building / villa" value={f.building} onChange={set("building")} placeholder="e.g. Marina Gate 2" />
          <Field label="Apartment / villa no." value={f.unit} onChange={set("unit")} placeholder="e.g. 1804" />
          <Field label="Area / community" value={f.area} onChange={set("area")} placeholder="e.g. Dubai Marina" />
          <Field
            label="Makani number"
            value={f.makani}
            onChange={set("makani")}
            placeholder="10 digits"
            hint="On your building's entrance plate."
          />
        </div>
        <div className="mt-3 space-y-3">
          <Field
            label="Google Maps pin"
            value={f.mapsUrl}
            onChange={set("mapsUrl")}
            placeholder="Paste a maps link"
            hint="The single fastest way for a driver to find you."
          />
          <Field
            label="Parking & access notes"
            value={f.accessNotes}
            onChange={set("accessNotes")}
            placeholder="e.g. Visitor parking P2, service lift, security needs ID"
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saved && !pending ? <Check size={15} /> : null}
          {pending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </button>
        <form action={signOut}>
          <button className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
