"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  ShoppingCart,
  Check,
  Truck,
  TrendingDown,
  ShieldCheck,
  Eye,
  Timer,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./CartProvider";

/** Everything a card needs, precomputed server-side (see src/lib/store.ts). */
export type CardItem = {
  id: string;
  title: string;
  brand: string | null;
  listPrice: number;
  retailPrice: number | null;
  discountPct: number | null;
  saveAmount: number | null;
  priceDropped: boolean;
  nextDropDays: number | null;
  condition: string | null;
  possession: "warehouse" | "in_place";
  categoryId: string | null;
  sellerId: string;
  photo: string | null;
  views: number;
  saves: number;
};

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

const WISH_KEY = "hoosa-wishlist";

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISH_KEY);
    const val = raw ? JSON.parse(raw) : [];
    return Array.isArray(val) ? val : [];
  } catch {
    return [];
  }
}

function useWishlist(id: string) {
  const [wished, setWished] = useState(false);
  useEffect(() => {
    setWished(readWishlist().includes(id));
  }, [id]);
  function toggle() {
    const list = readWishlist();
    const isAdding = !list.includes(id);
    const next = isAdding ? [...list, id] : list.filter((x) => x !== id);
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(next));
    } catch {}
    setWished(isAdding);
    const supabase = createClient();
    // Signed-in saves persist server-side (and subscribe to price drops); guests
    // fall back to the counter-only RPC so the ❤ figure still moves.
    supabase.auth.getUser().then(({ data }) => {
      const call = data.user
        ? supabase.rpc("toggle_saved_item", { p_item_id: id, p_saved: isAdding })
        : supabase.rpc("record_item_save", { p_item_id: id, p_delta: isAdding ? 1 : -1 });
      call.then(
        () => {},
        () => {}
      );
    });
  }
  return { wished, toggle };
}

export function ProductCard({ item, className = "" }: { item: CardItem; className?: string }) {
  const { has, add, remove } = useCart();
  const { wished, toggle } = useWishlist(item.id);
  const inCart = has(item.id);

  return (
    <Link
      href={`/shop/${item.id}`}
      className={`group block rounded-2xl transition-all duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Image + overlay badges */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow duration-300 group-hover:shadow-card-hover">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {item.discountPct != null && item.discountPct >= 5 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              −{item.discountPct}%
            </span>
          )}
          {item.priceDropped && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              <TrendingDown size={11} /> Price dropped
            </span>
          )}
        </div>

        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            toggle();
          }}
          className="absolute right-2 top-2 rounded-full bg-bg/85 p-2 shadow-sm backdrop-blur transition-transform hover:scale-110"
        >
          <Heart size={15} className={wished ? "fill-red-500 text-red-500" : "text-muted"} />
        </button>

        {/* Drop countdown — the markdown clock, made visible */}
        {item.nextDropDays != null && item.nextDropDays <= 14 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-bg/85 px-2 py-0.5 text-[11px] font-medium text-ink shadow-sm backdrop-blur">
            <Timer size={11} className="text-accent" /> Drops in {item.nextDropDays}d
          </span>
        )}
      </div>

      {/* Details */}
      <div className="mt-2.5 space-y-1 px-0.5">
        <div className="truncate text-sm font-medium leading-tight">
          {item.brand ? <span className="text-muted">{item.brand} · </span> : null}
          {item.title}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-bold">{formatMoney(item.listPrice)}</span>
          {item.retailPrice != null && item.retailPrice > item.listPrice && (
            <span className="text-xs text-muted line-through">{formatMoney(item.retailPrice)}</span>
          )}
          {item.saveAmount != null && item.saveAmount > 0 && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              Save {formatMoney(item.saveAmount)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-1.5 py-0.5 font-medium text-brand">
            <ShieldCheck size={10} /> Inspected
          </span>
          {item.condition && (
            <span className="rounded-full border border-border px-1.5 py-0.5">
              {CONDITION_LABEL[item.condition] ?? item.condition}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Truck size={11} />
            {item.possession === "warehouse" ? "2–3 days" : "4–5 days"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            {item.views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye size={11} /> {item.views}
              </span>
            )}
            {item.saves > 0 && (
              <span className="inline-flex items-center gap-1">
                <Heart size={10} /> {item.saves}
              </span>
            )}
          </div>

          <button
            aria-label={inCart ? "In cart" : "Add to cart"}
            onClick={(e) => {
              e.preventDefault();
              inCart ? remove(item.id) : add(item.id);
            }}
            className={`rounded-full p-2 transition-all active:scale-90 ${
              inCart
                ? "bg-brand text-brand-fg"
                : "border border-border text-muted hover:border-brand hover:bg-brand/5 hover:text-brand"
            }`}
          >
            {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
