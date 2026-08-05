"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import type { PossessionMode } from "@/lib/domain/item-state";
import {
  updateValueFloor,
  updateMarkdownClock,
  updateTierPct,
  addZone,
  setZoneActive,
  addCategory,
  setCategoryActive,
} from "../admin-actions";

type Tier = { id: string; minPrice: number; maxPrice: number | null; marketplacePct: number; active: boolean };
type Zone = { id: string; name: string; emirate: string; active: boolean };
type Category = { id: string; name: string; possession_default: string; active: boolean };

export function SettingsForms({
  amAdmin,
  floor,
  markdown,
  tiers,
  zones,
  categories,
}: {
  amAdmin: boolean;
  floor: number;
  markdown: { days: number; pct: number; interval: number };
  tiers: Tier[];
  zones: Zone[];
  categories: Category[];
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
