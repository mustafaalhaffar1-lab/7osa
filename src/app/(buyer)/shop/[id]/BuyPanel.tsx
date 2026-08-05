"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/store/CartProvider";
import { purchaseItem, makeOffer } from "../actions";

export function BuyPanel({ itemId, price, isAuthed }: { itemId: string; price: number | null; isAuthed: boolean }) {
  const router = useRouter();
  const { has, add, remove } = useCart();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const inCart = has(itemId);

  const cartButton = (
    <button
      onClick={() => (inCart ? remove(itemId) : add(itemId))}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-medium transition-colors hover:border-brand hover:text-brand sm:w-auto"
    >
      {inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
      {inCart ? "In cart" : "Add to cart"}
    </button>
  );

  if (!isAuthed) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/login" className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-medium text-brand-fg hover:opacity-90 sm:w-auto">
          Sign in to buy
        </Link>
        {cartButton}
      </div>
    );
  }

  function buy() {
    setError(null);
    start(async () => {
      const res = await purchaseItem(itemId);
      if ("error" in res) setError(res.error);
      else router.push("/purchases");
    });
  }

  function sendOffer() {
    setError(null);
    start(async () => {
      const res = await makeOffer(itemId, parseFloat(offer));
      if ("error" in res) setError(res.error);
      else { setOfferSent(true); setOffer(""); }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={buy}
          disabled={pending || price == null}
          className="w-full rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-48"
        >
          {pending ? "Processing…" : `Buy now${price != null ? ` · ${formatMoney(price)}` : ""}`}
        </button>
        {cartButton}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          inputMode="numeric"
          placeholder="Make an offer (AED)"
          className="w-44 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand"
        />
        <button onClick={sendOffer} disabled={pending || !offer}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-50">
          Offer
        </button>
      </div>

      {offerSent && <p className="text-sm text-brand">Offer sent — we&apos;ll be in touch.</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
