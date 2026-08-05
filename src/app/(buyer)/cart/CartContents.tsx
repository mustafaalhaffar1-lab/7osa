"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/components/store/CartProvider";
import { formatMoney } from "@/lib/format";
import { purchaseItem } from "../shop/actions";

type CartRow = {
  id: string;
  title: string;
  brand: string | null;
  list_price: number | null;
  status: string;
  photo: string | null;
};

export function CartContents({ signedIn }: { signedIn: boolean }) {
  const { ids, remove, count } = useCart();
  const router = useRouter();
  const [rows, setRows] = useState<CartRow[] | null>(null);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch live details for whatever is in the cart. Items sold since being added
  // simply won't come back from the listed-only query — surface them as unavailable.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (ids.length === 0) {
        setRows([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("items")
        .select("id, title, brand, list_price, status, item_photos(url)")
        .in("id", ids);
      if (cancelled) return;
      const found = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        brand: r.brand,
        list_price: r.list_price,
        status: r.status,
        photo: (r.item_photos as { url: string }[] | null)?.[0]?.url ?? null,
      }));
      // Preserve cart order; mark ids that no longer resolve to a live item.
      const byId = new Map(found.map((r) => [r.id, r]));
      setRows(
        ids.map(
          (id) =>
            byId.get(id) ?? {
              id,
              title: "No longer available",
              brand: null,
              list_price: null,
              status: "unavailable",
              photo: null,
            }
        )
      );
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const available = (rows ?? []).filter((r) => r.status === "listed" && r.list_price != null);
  const subtotal = available.reduce((sum, r) => sum + (r.list_price ?? 0), 0);

  function checkout() {
    setErrors({});
    start(async () => {
      const failed: Record<string, string> = {};
      let bought = 0;
      for (const row of available) {
        const res = await purchaseItem(row.id);
        if ("error" in res) failed[row.id] = res.error;
        else {
          bought++;
          remove(row.id);
        }
      }
      setErrors(failed);
      if (bought > 0 && Object.keys(failed).length === 0) {
        router.push("/purchases");
        router.refresh();
      }
    });
  }

  if (rows === null) {
    return <p className="mt-8 text-sm text-muted">Loading…</p>;
  }

  if (count === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-surface p-12 text-center text-muted">
        Your cart is empty.{" "}
        <Link href="/" className="text-brand hover:underline">
          Start shopping
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <ul className="space-y-3">
        {rows.map((r) => {
          const unavailable = r.status !== "listed";
          return (
            <li
              key={r.id}
              className={`flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 ${unavailable ? "opacity-60" : ""}`}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                {r.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photo} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {r.brand ? `${r.brand} · ` : ""}
                  {r.title}
                </div>
                {unavailable ? (
                  <div className="text-sm text-red-500">No longer available — remove it</div>
                ) : (
                  errors[r.id] && <div className="text-sm text-red-500">{errors[r.id]}</div>
                )}
              </div>
              <div className="shrink-0 font-medium">
                {r.list_price != null ? formatMoney(r.list_price) : "—"}
              </div>
              <button
                aria-label="Remove"
                onClick={() => remove(r.id)}
                className="shrink-0 rounded-full p-2 text-muted transition-colors hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5">
        <div>
          <div className="text-sm text-muted">Subtotal ({available.length} item{available.length === 1 ? "" : "s"})</div>
          <div className="text-2xl font-semibold">{formatMoney(subtotal)}</div>
        </div>
        {signedIn ? (
          <button
            onClick={checkout}
            disabled={pending || available.length === 0}
            className="rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Processing…" : "Checkout"}
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Sign in to checkout
          </Link>
        )}
      </div>
    </div>
  );
}
