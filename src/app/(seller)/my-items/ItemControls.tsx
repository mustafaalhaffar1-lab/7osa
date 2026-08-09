"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { updateMyItem, withdrawMyItem } from "./actions";

const PREFS = [
  { key: "keep", label: "Keep it listed", hint: "Stay on sale at my minimum price." },
  { key: "return", label: "Return it to me", hint: "Bring it back if it doesn't sell." },
  { key: "donate", label: "Donate it", hint: "Give it to charity on my behalf." },
  { key: "buyout", label: "Offer me a buyout", hint: "Hoosa may buy it from me outright." },
] as const;

const WITHDRAWABLE = new Set(["draft", "estimated", "accepted", "listed"]);

/** Everything a seller can control after listing — the promise the sell page makes. */
export function ItemControls({
  itemId,
  status,
  minPrice,
  autoAccept,
  pref,
  companyOwned,
}: {
  itemId: string;
  status: string;
  minPrice: number | null;
  autoAccept: number | null;
  pref: string;
  companyOwned: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [min, setMin] = useState(minPrice != null ? String(minPrice) : "");
  const [auto, setAuto] = useState(autoAccept != null ? String(autoAccept) : "");
  const [choice, setChoice] = useState(pref);

  if (companyOwned) {
    return <span className="text-xs text-muted">Bought by Hoosa</span>;
  }

  function save() {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await updateMyItem(itemId, {
        minPrice: min ? parseFloat(min) : null,
        pref: choice,
        autoAccept: auto ? parseFloat(auto) : null,
      });
      if (res?.error) setError(res.error);
      else {
        setNotice("Saved.");
        router.refresh();
      }
    });
  }

  function withdraw() {
    setError(null);
    start(async () => {
      const res = await withdrawMyItem(itemId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
      >
        <Settings2 size={13} /> {open ? "Hide options" : "Options"}
      </button>

      {open && (
        <div className="mt-3 space-y-4 rounded-xl border border-border bg-bg p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Never sell below (AED)
              </span>
              <input
                value={min}
                onChange={(e) => setMin(e.target.value)}
                inputMode="numeric"
                placeholder="No minimum"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Auto-accept offers above (AED)
              </span>
              <input
                value={auto}
                onChange={(e) => setAuto(e.target.value)}
                inputMode="numeric"
                placeholder="Review every offer"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              If it reaches my minimum and still hasn&apos;t sold…
            </span>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {PREFS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setChoice(p.key)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    choice === p.key
                      ? "border-brand bg-brand/5"
                      : "border-border hover:border-brand/50"
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-[11px] text-muted">{p.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {notice && <p className="text-xs text-brand">{notice}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={pending}
              className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save preferences"}
            </button>
            {WITHDRAWABLE.has(status) && (
              <button
                onClick={withdraw}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
              >
                <X size={12} /> Withdraw this item
              </button>
            )}
            {minPrice != null && (
              <span className="text-[11px] text-muted">
                Current floor {formatMoney(minPrice)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
