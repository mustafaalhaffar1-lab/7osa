"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Check, Truck, TrendingDown } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "./CartProvider";

/** Everything a card needs, precomputed server-side (see src/lib/store.ts). */
export type CardItem = {
  id: string;
  title: string;
  brand: string | null;
  listPrice: number;
  retailPrice: number | null;
  discountPct: number | null;
  priceDropped: boolean;
  condition: string | null;
  possession: "warehouse" | "in_place";
  categoryId: string | null;
  sellerId: string;
  photo: string | null;
};

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

const WISH_KEY = "7osa-wishlist";

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
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(next));
    } catch {}
    setWished(next.includes(id));
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
      className={`group block ${className}`}
    >
      {/* Image + overlay badges */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
        )}

        {/* Discount / price-drop badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {item.discountPct != null && item.discountPct >= 5 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              -{item.discountPct}%
            </span>
          )}
          {item.priceDropped && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
              <TrendingDown size={11} /> Price dropped
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            toggle();
          }}
          className="absolute right-2 top-2 rounded-full bg-bg/80 p-2 backdrop-blur transition-colors hover:bg-bg"
        >
          <Heart
            size={15}
            className={wished ? "fill-red-500 text-red-500" : "text-muted"}
          />
        </button>
      </div>

      {/* Details */}
      <div className="mt-2.5 space-y-1">
        <div className="truncate text-sm font-medium leading-tight">
          {item.brand ? <span className="text-muted">{item.brand} · </span> : null}
          {item.title}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{formatMoney(item.listPrice)}</span>
          {item.retailPrice != null && item.retailPrice > item.listPrice && (
            <span className="text-xs text-muted line-through">{formatMoney(item.retailPrice)}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            {item.condition && (
              <span className="rounded-full border border-border px-2 py-0.5">
                {CONDITION_LABEL[item.condition] ?? item.condition}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Truck size={11} />
              {item.possession === "warehouse" ? "2–3 days" : "4–5 days"}
            </span>
          </div>

          {/* Quick add to cart */}
          <button
            aria-label={inCart ? "In cart" : "Add to cart"}
            onClick={(e) => {
              e.preventDefault();
              inCart ? remove(item.id) : add(item.id);
            }}
            className={`rounded-full p-2 transition-colors ${
              inCart
                ? "bg-brand text-brand-fg"
                : "border border-border text-muted hover:border-brand hover:text-brand"
            }`}
          >
            {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
