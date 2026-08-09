"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Undo2, HeartHandshake, Wallet, RefreshCw, Clock } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { resolveUnsold } from "../admin-actions";

export type StuckItem = {
  id: string;
  sku: string | null;
  title: string;
  brand: string | null;
  list_price: number | null;
  seller_min_price: number | null;
  retail_price: number | null;
  floor_reached_at: string;
  end_of_life_pref: string;
  company_owned: boolean;
  listed_at: string | null;
  item_photos: { url: string }[] | null;
  profiles: { full_name: string | null } | null;
};

const PREF_LABEL: Record<string, string> = {
  keep: "Keep listing",
  return: "Return to me",
  donate: "Donate it",
  buyout: "Offer me a buyout",
};

export function UnsoldRows({ items, graceDays }: { items: StuckItem[]; graceDays: number }) {
  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        Nothing stuck — every listed item still has room to move.
      </p>
    );
  }
  return (
    <ul className="mt-4 space-y-3">
      {items.map((i) => (
        <Row key={i.id} item={i} graceDays={graceDays} />
      ))}
    </ul>
  );
}

function Row({ item, graceDays }: { item: StuckItem; graceDays: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"buyout" | "relist" | null>(null);
  const [amount, setAmount] = useState("");

  const photo = item.item_photos?.[0]?.url;
  const daysStuck = Math.floor((Date.now() - +new Date(item.floor_reached_at)) / 86_400_000);
  const overdue = daysStuck >= graceDays;

  function run(action: "return" | "donate" | "buyout" | "relist", amt?: number) {
    setError(null);
    start(async () => {
      const res = await resolveUnsold(item.id, action, amt);
      if (res?.error) setError(res.error);
      else {
        setMode(null);
        router.refresh();
      }
    });
  }

  return (
    <li className={`rounded-2xl border bg-surface p-4 ${overdue ? "border-accent/50" : "border-border"}`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1 basis-56">
          <Link href={`/ops/products/${item.id}`} className="truncate text-sm font-medium hover:underline">
            {item.brand ? `${item.brand} · ` : ""}
            {item.title}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.sku && <span className="font-mono text-[11px] text-brand">{item.sku}</span>}
            <span>{item.profiles?.full_name ?? "Seller"}</span>
            <span
              className={`inline-flex items-center gap-1 ${overdue ? "font-medium text-accent" : ""}`}
            >
              <Clock size={11} /> {daysStuck}d at floor
            </span>
            <span className="rounded-full border border-border px-2 py-0.5">
              Seller wants: {PREF_LABEL[item.end_of_life_pref] ?? item.end_of_life_pref}
            </span>
          </div>
        </div>

        <div className="text-right text-sm">
          <div className="font-bold">{item.list_price != null ? formatMoney(item.list_price) : "—"}</div>
          <div className="text-[11px] text-muted">
            floor {item.seller_min_price != null ? formatMoney(item.seller_min_price) : "none"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Action icon={<Undo2 size={13} />} label="Return to seller" onClick={() => run("return")} disabled={pending} />
        <Action icon={<HeartHandshake size={13} />} label="Donate" onClick={() => run("donate")} disabled={pending} />
        <Action
          icon={<Wallet size={13} />}
          label="Hoosa buys it"
          onClick={() => {
            setMode(mode === "buyout" ? null : "buyout");
            setAmount(item.seller_min_price != null ? String(item.seller_min_price) : "");
          }}
          disabled={pending}
          active={mode === "buyout"}
        />
        <Action
          icon={<RefreshCw size={13} />}
          label="Relist at new price"
          onClick={() => {
            setMode(mode === "relist" ? null : "relist");
            setAmount(item.list_price != null ? String(item.list_price) : "");
          }}
          disabled={pending}
          active={mode === "relist"}
        />
      </div>

      {mode && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg p-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              {mode === "buyout" ? "We pay the seller (AED)" : "New list price (AED)"}
            </span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className="w-32 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <button
            disabled={pending || !amount}
            onClick={() => run(mode, parseFloat(amount))}
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "…" : mode === "buyout" ? "Buy it & pay seller" : "Relist"}
          </button>
          <p className="w-full text-[11px] text-muted">
            {mode === "buyout"
              ? "Credits the seller now. The item stays for sale but becomes Hoosa stock, with no floor."
              : "Puts it back on the clock at the new price."}
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}

function Action({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-border text-muted hover:border-brand hover:text-brand"
      }`}
    >
      {icon} {label}
    </button>
  );
}
