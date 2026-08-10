"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Phone, Truck, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";

export type DeliveryDetails = {
  phone: string;
  building: string;
  unit: string;
  area: string;
  address: string;
  makani: string;
  mapsUrl: string;
  accessNotes: string;
};

export type DeliveryDefaults = Partial<DeliveryDetails>;

/**
 * Nobody should be able to buy without telling us where to deliver. This is the last step
 * before money moves — prefilled from the profile so a repeat buyer just taps Confirm.
 */
export function CheckoutSheet({
  total,
  itemCount,
  defaults,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  total: number;
  itemCount: number;
  defaults?: DeliveryDefaults;
  pending: boolean;
  error: string | null;
  onConfirm: (d: DeliveryDetails) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<DeliveryDetails>({
    phone: defaults?.phone ?? "",
    building: defaults?.building ?? "",
    unit: defaults?.unit ?? "",
    area: defaults?.area ?? "",
    address: defaults?.address ?? "",
    makani: defaults?.makani ?? "",
    mapsUrl: defaults?.mapsUrl ?? "",
    accessNotes: defaults?.accessNotes ?? "",
  });

  const set = (k: keyof DeliveryDetails) => (v: string) => setD((p) => ({ ...p, [k]: v }));
  const ready = d.phone.trim().length >= 7 && (d.building.trim() || d.address.trim());

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-bg p-5 sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Where should we deliver?</h2>
            <p className="mt-0.5 text-sm text-muted">
              {itemCount} item{itemCount === 1 ? "" : "s"} · {formatMoney(total)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Mobile number" required icon={<Phone size={13} />}>
            <input
              value={d.phone}
              onChange={(e) => set("phone")(e.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="05X XXX XXXX"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
            <span className="mt-1 block text-[11px] text-muted">
              Our driver calls before arriving.
            </span>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Building / villa" required icon={<MapPin size={13} />}>
              <input
                value={d.building}
                onChange={(e) => set("building")(e.target.value)}
                placeholder="e.g. Marina Gate 2"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
            <Field label="Apartment / villa no.">
              <input
                value={d.unit}
                onChange={(e) => set("unit")(e.target.value)}
                placeholder="e.g. 1804"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Area / community">
              <input
                value={d.area}
                onChange={(e) => set("area")(e.target.value)}
                placeholder="e.g. Dubai Marina"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
            <Field label="Makani (optional)">
              <input
                value={d.makani}
                onChange={(e) => set("makani")(e.target.value)}
                inputMode="numeric"
                placeholder="10 digits"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </Field>
          </div>

          <Field label="Delivery notes (optional)">
            <input
              value={d.accessNotes}
              onChange={(e) => set("accessNotes")(e.target.value)}
              placeholder="Parking, gate code, best time to call"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Truck size={12} className="text-brand" /> Delivered in 2–3 days
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-brand" /> 3-day return window
          </span>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={() => onConfirm(d)}
          disabled={pending || !ready}
          className="mt-4 w-full rounded-full bg-brand px-6 py-3.5 font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Placing order…" : `Confirm order · ${formatMoney(total)}`}
        </button>
        {!ready && (
          <p className="mt-2 text-center text-[11px] text-muted">
            A phone number and building are needed so we can actually deliver.
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

function Field({
  label,
  children,
  required,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon} {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}
