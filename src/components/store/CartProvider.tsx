"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Lightweight cart: a list of item ids persisted in localStorage.
 * Every item is unique inventory (qty is always 1), so the cart is a set.
 * Checkout still goes through the purchase_item RPC per item — the cart is UX only.
 */
type CartContextValue = {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "7osa-cart";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const val = raw ? JSON.parse(raw) : [];
    return Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  // Load after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    setIds(read());
  }, []);

  function persist(next: string[]) {
    setIds(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  const value: CartContextValue = {
    ids,
    count: ids.length,
    has: (id) => ids.includes(id),
    add: (id) => {
      if (!ids.includes(id)) persist([...ids, id]);
    },
    remove: (id) => persist(ids.filter((x) => x !== id)),
    clear: () => persist([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
