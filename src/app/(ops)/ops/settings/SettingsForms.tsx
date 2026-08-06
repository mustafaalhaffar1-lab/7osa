"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import type { PossessionMode } from "@/lib/domain/item-state";
import type { AppRole } from "@/lib/domain/enums";
import {
  updateValueFloor,
  updateMarkdownClock,
  updateTierPct,
  addZone,
  setZoneActive,
  addCategory,
  setCategoryActive,
  grantStaffByEmail,
  setStaffRole,
  updateSetting,
} from "../admin-actions";

type Tier = { id: string; minPrice: number; maxPrice: number | null; marketplacePct: number; active: boolean };
type Zone = { id: string; name: string; emirate: string; active: boolean };
type Category = { id: string; name: string; possession_default: string; active: boolean };
type StaffMember = { id: string; email: string; fullName: string | null; roles: string[] };

const STAFF_ROLES: AppRole[] = ["ops_agent", "driver", "admin"];

export function SettingsForms({
  amAdmin,
  floor,
  markdown,
  tiers,
  zones,
  categories,
  staff,
  myId,
  scope,
  visitFee,
  delivery,
  tax,
  business,
}: {
  amAdmin: boolean;
  floor: number;
  markdown: { days: number; pct: number; interval: number };
  tiers: Tier[];
  zones: Zone[];
  categories: Category[];
  staff: StaffMember[];
  myId: string;
  scope: { maxWeightKg: number; maxLongestSideCm: number };
  visitFee: number;
  delivery: { amount: number; freeAbove: number };
  tax: { vatPct: number; pricesIncludeVat: boolean; trn: string };
  business: { name: string; supportEmail: string; city: string; phone: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // form state
  const [floorVal, setFloorVal] = useState(String(floor));
  const [mdDays, setMdDays] = useState(String(markdown.days));
  const [mdPct, setMdPct] = useState(String(markdown.pct));
  const [mdInterval, setMdInterval] = useState(String(markdown.interval));
  const [tierPcts, setTierPcts] = useState<Record<string, string>>(
    Object.fromEntries(tiers.map((t) => [t.id, String(Math.round(t.marketplacePct * 100))]))
  );
  const [newZone, setNewZone] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newCatMode, setNewCatMode] = useState<PossessionMode>("warehouse");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRoleSel] = useState<AppRole>("ops_agent");
  const [maxKg, setMaxKg] = useState(String(scope.maxWeightKg));
  const [maxCm, setMaxCm] = useState(String(scope.maxLongestSideCm));
  const [fee, setFee] = useState(String(visitFee));
  const [delAmt, setDelAmt] = useState(String(delivery.amount));
  const [delFree, setDelFree] = useState(String(delivery.freeAbove));
  const [vat, setVat] = useState(String(tax.vatPct));
  const [vatIncl, setVatIncl] = useState(tax.pricesIncludeVat);
  const [trn, setTrn] = useState(tax.trn);
  const [bizName, setBizName] = useState(business.name);
  const [bizEmail, setBizEmail] = useState(business.supportEmail);
  const [bizCity, setBizCity] = useState(business.city);
  const [bizPhone, setBizPhone] = useState(business.phone);

  function run(fn: () => Promise<{ error?: string }>, done: string) {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setNotice(done);
        router.refresh();
      }
    });
  }

  const disabled = !amAdmin || pending;

  return (
    <div className="mt-5 space-y-5">
      {(error || notice) && (
        <p
          className={`rounded-xl px-4 py-2.5 text-sm ${
            error ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-brand/10 text-brand"
          }`}
        >
          {error ?? notice}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Concierge value floor */}
        <Card title="Concierge value floor" sub="Minimum expected sale value to accept an item. Below this, sellers are routed to self-serve.">
          <div className="flex items-center gap-2">
            <Input value={floorVal} onChange={setFloorVal} prefix="AED" disabled={disabled} />
            <SaveBtn disabled={disabled} onClick={() => run(() => updateValueFloor(parseFloat(floorVal)), "Value floor updated.")} />
          </div>
        </Card>

        {/* Markdown clock */}
        <Card title="Markdown clock" sub="Unsold items drop automatically — the engine behind every countdown on the storefront.">
          <div className="flex flex-wrap items-end gap-2">
            <Labeled label="First drop after (days)">
              <Input value={mdDays} onChange={setMdDays} disabled={disabled} />
            </Labeled>
            <Labeled label="Drop %">
              <Input value={mdPct} onChange={setMdPct} disabled={disabled} />
            </Labeled>
            <Labeled label="Repeat every (days)">
              <Input value={mdInterval} onChange={setMdInterval} disabled={disabled} />
            </Labeled>
            <SaveBtn
              disabled={disabled}
              onClick={() =>
                run(
                  () => updateMarkdownClock(parseFloat(mdDays), parseFloat(mdPct), parseFloat(mdInterval)),
                  "Markdown clock updated."
                )
              }
            />
          </div>
        </Card>
      </div>

      {/* Commission tiers */}
      <Card title="Commission tiers" sub="Hoosa's cut by final sale price. The seller keeps the rest — shown live on the sell page.">
        <ul className="space-y-2">
          {tiers.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
              <span className="min-w-40 flex-1">
                {t.maxPrice != null
                  ? `${formatMoney(t.minPrice)} – ${formatMoney(t.maxPrice)}`
                  : `Over ${formatMoney(t.minPrice)}`}
              </span>
              <span className="text-xs text-muted">Hoosa keeps</span>
              <Input
                value={tierPcts[t.id] ?? ""}
                onChange={(v) => setTierPcts((p) => ({ ...p, [t.id]: v }))}
                suffix="%"
                disabled={disabled}
                narrow
              />
              <span className="text-xs text-muted">
                seller gets {100 - (parseFloat(tierPcts[t.id]) || 0)}%
              </span>
              <SaveBtn
                disabled={disabled}
                onClick={() => run(() => updateTierPct(t.id, parseFloat(tierPcts[t.id])), "Commission updated.")}
              />
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Zones */}
        <Card title="Pickup & delivery zones" sub="Where Hoosa operates.">
          <ul className="space-y-1.5">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm">
                <span className={z.active ? "" : "text-muted line-through"}>
                  {z.name} <span className="text-xs text-muted">· {z.emirate}</span>
                </span>
                <ToggleBtn
                  active={z.active}
                  disabled={disabled}
                  onClick={() => run(() => setZoneActive(z.id, !z.active), z.active ? "Zone disabled." : "Zone enabled.")}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              placeholder="New zone name"
              disabled={disabled}
              className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <SaveBtn
              label="Add"
              disabled={disabled || !newZone.trim()}
              onClick={() =>
                run(async () => {
                  const r = await addZone(newZone);
                  if (!r.error) setNewZone("");
                  return r;
                }, "Zone added.")
              }
            />
          </div>
        </Card>

        {/* Categories */}
        <Card title="Categories" sub="What Hoosa accepts, and the default custody model for each.">
          <ul className="space-y-1.5">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm">
                <span className={c.active ? "" : "text-muted line-through"}>
                  {c.name}{" "}
                  <span className="text-xs text-muted">
                    · {c.possession_default === "warehouse" ? "warehouse" : "collect-on-sale"}
                  </span>
                </span>
                <ToggleBtn
                  active={c.active}
                  disabled={disabled}
                  onClick={() =>
                    run(() => setCategoryActive(c.id, !c.active), c.active ? "Category disabled." : "Category enabled.")
                  }
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New category name"
              disabled={disabled}
              className="flex-1 basis-40 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <select
              value={newCatMode}
              onChange={(e) => setNewCatMode(e.target.value as PossessionMode)}
              disabled={disabled}
              className="rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="warehouse">Warehouse</option>
              <option value="in_place">Collect-on-sale</option>
            </select>
            <SaveBtn
              label="Add"
              disabled={disabled || !newCat.trim()}
              onClick={() =>
                run(async () => {
                  const r = await addCategory(newCat, newCatMode);
                  if (!r.error) setNewCat("");
                  return r;
                }, "Category added.")
              }
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* What we accept */}
        <Card title="What we accept" sub="Items bigger or heavier than this are declined at intake. These limits govern the seller wizard live.">
          <div className="flex flex-wrap items-end gap-2">
            <Labeled label="Max weight (kg)">
              <Input value={maxKg} onChange={setMaxKg} disabled={disabled} narrow />
            </Labeled>
            <Labeled label="Max longest side (cm)">
              <Input value={maxCm} onChange={setMaxCm} disabled={disabled} narrow />
            </Labeled>
            <SaveBtn
              disabled={disabled}
              onClick={() =>
                run(
                  () =>
                    updateSetting("launch_scope", {
                      max_weight_kg: parseFloat(maxKg),
                      max_longest_side_cm: parseFloat(maxCm),
                    }),
                  "Intake limits updated."
                )
              }
            />
          </div>
        </Card>

        {/* Pickup visit fee */}
        <Card title="Pickup visit fee" sub="Charged when a seller books a home visit — credited back to their wallet on their first sale.">
          <div className="flex items-center gap-2">
            <Input value={fee} onChange={setFee} prefix="AED" disabled={disabled} />
            <SaveBtn
              disabled={disabled}
              onClick={() => run(() => updateSetting("visit_fee", { amount: parseFloat(fee) }), "Visit fee updated.")}
            />
          </div>
        </Card>

        {/* Delivery */}
        <Card title="Delivery" sub="What buyers pay for delivery. Set 0 for free delivery on everything.">
          <div className="flex flex-wrap items-end gap-2">
            <Labeled label="Delivery fee">
              <Input value={delAmt} onChange={setDelAmt} prefix="AED" disabled={disabled} narrow />
            </Labeled>
            <Labeled label="Free above">
              <Input value={delFree} onChange={setDelFree} prefix="AED" disabled={disabled} narrow />
            </Labeled>
            <SaveBtn
              disabled={disabled}
              onClick={() =>
                run(
                  () =>
                    updateSetting("delivery_fee", {
                      amount: parseFloat(delAmt),
                      free_above: parseFloat(delFree),
                    }),
                  "Delivery settings updated."
                )
              }
            />
          </div>
        </Card>

        {/* Tax */}
        <Card title="Tax (VAT)" sub="UAE VAT settings used on invoices and receipts.">
          <div className="flex flex-wrap items-end gap-2">
            <Labeled label="VAT %">
              <Input value={vat} onChange={setVat} suffix="%" disabled={disabled} narrow />
            </Labeled>
            <Labeled label="TRN">
              <input
                value={trn}
                onChange={(e) => setTrn(e.target.value)}
                disabled={disabled}
                placeholder="Tax registration no."
                className="w-40 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Labeled>
            <label className="mb-2 inline-flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={vatIncl}
                onChange={(e) => setVatIncl(e.target.checked)}
                disabled={disabled}
                className="accent-[rgb(var(--brand))]"
              />
              Prices include VAT
            </label>
            <SaveBtn
              disabled={disabled}
              onClick={() =>
                run(
                  () =>
                    updateSetting("tax", {
                      vat_pct: parseFloat(vat),
                      prices_include_vat: vatIncl,
                      trn,
                    }),
                  "Tax settings updated."
                )
              }
            />
          </div>
        </Card>
      </div>

      {/* Business details */}
      <Card title="Business details" sub="Shown to customers in emails, receipts, and support links.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Labeled label="Business name">
            <TextInput value={bizName} onChange={setBizName} disabled={disabled} />
          </Labeled>
          <Labeled label="Support email">
            <TextInput value={bizEmail} onChange={setBizEmail} disabled={disabled} />
          </Labeled>
          <Labeled label="City">
            <TextInput value={bizCity} onChange={setBizCity} disabled={disabled} />
          </Labeled>
          <Labeled label="Phone">
            <TextInput value={bizPhone} onChange={setBizPhone} disabled={disabled} />
          </Labeled>
        </div>
        <div className="mt-3">
          <SaveBtn
            disabled={disabled}
            onClick={() =>
              run(
                () =>
                  updateSetting("business", {
                    name: bizName,
                    support_email: bizEmail,
                    city: bizCity,
                    phone: bizPhone,
                  }),
                "Business details updated."
              )
            }
          />
        </div>
      </Card>

      {/* System users & roles */}
      <Card title="System users & roles" sub="Who can access the operations console. ops_agent & driver operate; admin can also configure and manage roles.">
        <ul className="space-y-1.5">
          {staff.length === 0 && <li className="text-sm text-muted">No staff yet.</li>}
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {s.fullName || s.email} {s.id === myId && <span className="text-xs text-muted">(you)</span>}
                </div>
                <div className="truncate text-xs text-muted">{s.email}</div>
              </div>
              <div className="flex gap-1.5">
                {STAFF_ROLES.map((r) => {
                  const has = s.roles.includes(r);
                  return (
                    <button
                      key={r}
                      disabled={disabled}
                      onClick={() =>
                        run(() => setStaffRole(s.id, r, !has), has ? "Role revoked." : "Role granted.")
                      }
                      title={amAdmin ? (has ? `Revoke ${r}` : `Grant ${r}`) : "Admins only"}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        has ? "bg-brand text-brand-fg" : "border border-border text-muted hover:border-brand hover:text-brand"
                      }`}
                    >
                      {r.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
            placeholder="Grant staff access by email"
            disabled={disabled}
            className="flex-1 basis-52 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <select
            value={staffRole}
            onChange={(e) => setStaffRoleSel(e.target.value as AppRole)}
            disabled={disabled}
            className="rounded-xl border border-border bg-bg px-3 py-2 text-sm capitalize outline-none focus:border-brand"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
          <SaveBtn
            label="Grant"
            disabled={disabled || !staffEmail.trim()}
            onClick={() =>
              run(async () => {
                const r = await grantStaffByEmail(staffEmail, staffRole);
                if (!r.error) setStaffEmail("");
                return r;
              }, "Staff access granted.")
            }
          />
        </div>
      </Card>
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-muted">{sub}</p>
      {children}
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  prefix,
  suffix,
  disabled,
  narrow,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  narrow?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm focus-within:border-brand ${narrow ? "w-24" : "w-32"}`}>
      {prefix && <span className="text-xs text-muted">{prefix}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        disabled={disabled}
        className="w-full bg-transparent outline-none disabled:opacity-60"
      />
      {suffix && <span className="text-xs text-muted">{suffix}</span>}
    </span>
  );
}

function TextInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
    />
  );
}

function SaveBtn({ onClick, disabled, label = "Save" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function ToggleBtn({ active, onClick, disabled }: { active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        active
          ? "bg-brand/10 text-brand hover:bg-red-500/10 hover:text-red-500"
          : "border border-border text-muted hover:border-brand hover:text-brand"
      }`}
    >
      {active ? "Active" : "Disabled"}
    </button>
  );
}
