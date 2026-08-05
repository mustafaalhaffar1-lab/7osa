"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Truck, PackageCheck, ClipboardCheck, Tag, CheckCircle2 } from "lucide-react";
import { CONDITION_GRADES, type ConditionGrade } from "@/lib/domain/enums";
import type { ItemStatus, PossessionMode } from "@/lib/domain/item-state";
import { formatMoney } from "@/lib/format";
import { opsSetStatus, opsInspect, opsList } from "./actions";

export type OpsItem = {
  id: string;
  title: string;
  brand: string | null;
  status: ItemStatus;
  possession: PossessionMode;
  condition_grade: ConditionGrade | null;
  ai_estimate_min: number | null;
  ai_estimate_max: number | null;
  list_price: number | null;
  item_photos: { url: string }[] | null;
};

type Bucket = "collect" | "transit" | "inspect" | "list" | "live";

function bucketOf(it: OpsItem): Bucket | null {
  switch (it.status) {
    case "pickup_scheduled": return "collect";
    case "collected": return "transit";
    case "received": return "inspect";
    case "inspected": return "list";
    case "accepted": return it.possession === "in_place" ? "list" : null;
    case "listed": return "live";
    default: return null;
  }
}

const SECTIONS: { key: Bucket; label: string; icon: React.ReactNode }[] = [
  { key: "collect", label: "To collect", icon: <Truck size={16} /> },
  { key: "transit", label: "In transit to studio", icon: <PackageCheck size={16} /> },
  { key: "inspect", label: "Awaiting inspection", icon: <ClipboardCheck size={16} /> },
  { key: "list", label: "Ready to price & list", icon: <Tag size={16} /> },
  { key: "live", label: "Live", icon: <CheckCircle2 size={16} /> },
];

export function OpsBoard({ items }: { items: OpsItem[] }) {
  const grouped = SECTIONS.map((s) => ({
    ...s,
    items: items.filter((it) => bucketOf(it) === s.key),
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
      <p className="mt-1 text-sm text-muted">Move items from pickup to live. {items.length} in the pipeline.</p>

      <div className="mt-8 space-y-8">
        {grouped.map((g) => (
          <section key={g.key}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              {g.icon} {g.label}
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs">{g.items.length}</span>
            </h2>
            {g.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                Nothing here.
              </p>
            ) : (
              <ul className="space-y-3">
                {g.items.map((it) => <Card key={it.id} item={it} bucket={g.key} />)}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

function Card({ item, bucket }: { item: OpsItem; bucket: Bucket }) {
  const photo = item.item_photos?.[0]?.url;
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{item.title}</div>
          <div className="text-sm text-muted">
            {item.ai_estimate_min != null && item.ai_estimate_max != null
              ? `Est. ${formatMoney(item.ai_estimate_min)} - ${formatMoney(item.ai_estimate_max)}`
              : "No estimate"}
            {" · "}{item.possession === "warehouse" ? "Warehouse" : "In place"}
            {item.list_price != null && bucket === "live" ? ` · Listed at ${formatMoney(item.list_price)}` : ""}
          </div>
        </div>
        <Actions item={item} bucket={bucket} />
      </div>
    </li>
  );
}

function Actions({ item, bucket }: { item: OpsItem; bucket: Bucket }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (bucket === "collect")
    return <Btn pending={pending} onClick={() => run(() => opsSetStatus(item.id, "collected"))}>Mark collected</Btn>;
  if (bucket === "transit")
    return <Btn pending={pending} onClick={() => run(() => opsSetStatus(item.id, "received"))}>Mark received</Btn>;
  if (bucket === "live") return <span className="text-xs font-medium text-brand">Live</span>;

  // inspect + list open an inline form
  return (
    <div className="relative">
      <Btn pending={false} onClick={() => setOpen((o) => !o)}>
        {bucket === "inspect" ? "Inspect" : "Price & list"}
      </Btn>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg">
          {bucket === "inspect"
            ? <InspectForm item={item} pending={pending} error={error} onSubmit={(v) => run(() => opsInspect(item.id, v))} />
            : <ListForm item={item} pending={pending} error={error} onSubmit={(p) => run(() => opsList(item.id, p))} />}
        </div>
      )}
    </div>
  );
}

function InspectForm({
  item, pending, error, onSubmit,
}: {
  item: OpsItem; pending: boolean; error: string | null;
  onSubmit: (v: { condition: ConditionGrade; functional: boolean; dataWipe: boolean; notes: string }) => void;
}) {
  const [condition, setCondition] = useState<ConditionGrade>(item.condition_grade ?? "excellent");
  const [functional, setFunctional] = useState(true);
  const [dataWipe, setDataWipe] = useState(true);
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Confirmed condition</span>
        <select value={condition} onChange={(e) => setCondition(e.target.value as ConditionGrade)}
          className="w-full rounded-lg border border-border bg-bg px-2 py-1.5">
          {CONDITION_GRADES.map((g) => <option key={g} value={g}>{g.replace("_", " ")}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={functional} onChange={(e) => setFunctional(e.target.checked)} /> Functional test passed</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={dataWipe} onChange={(e) => setDataWipe(e.target.checked)} /> Data wiped / factory reset</label>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)"
        className="w-full rounded-lg border border-border bg-bg px-2 py-1.5" />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Btn pending={pending} onClick={() => onSubmit({ condition, functional, dataWipe, notes })} full>Save inspection</Btn>
    </div>
  );
}

function ListForm({
  item, pending, error, onSubmit,
}: {
  item: OpsItem; pending: boolean; error: string | null; onSubmit: (price: number) => void;
}) {
  const suggested = item.list_price
    ?? (item.ai_estimate_min && item.ai_estimate_max
        ? Math.round((item.ai_estimate_min + item.ai_estimate_max) / 2)
        : 0);
  const [price, setPrice] = useState(String(suggested || ""));
  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">List price (AED)</span>
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric"
          className="w-full rounded-lg border border-border bg-bg px-2 py-1.5" />
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Btn pending={pending} onClick={() => onSubmit(parseFloat(price))} full>Publish listing</Btn>
    </div>
  );
}

function Btn({ children, onClick, pending, full }: {
  children: React.ReactNode; onClick: () => void; pending: boolean; full?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={pending}
      className={`shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60 ${full ? "w-full" : ""}`}>
      {pending ? "..." : children}
    </button>
  );
}
