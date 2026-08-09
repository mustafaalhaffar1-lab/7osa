"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { requestPayout } from "./actions";

export function CashOut({ balance }: { balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null);

  function submit() {
    setMsg(null);
    const n = parseFloat(amount);
    start(async () => {
      const res = await requestPayout(n);
      if ("error" in res) setMsg({ err: res.error });
      else {
        setMsg({ ok: "Withdrawal requested — we'll transfer it to your bank." });
        setAmount("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="text-sm font-semibold">Cash out</div>
      <p className="mt-0.5 text-xs text-muted">Withdraw to your bank account.</p>

      <div className="mt-3 flex items-center gap-1 rounded-xl border border-border bg-bg px-3 py-2 focus-within:border-brand">
        <span className="text-xs text-muted">AED</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="w-full bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => setAmount(String(balance))}
          className="text-xs font-medium text-brand hover:underline"
        >
          Max
        </button>
      </div>

      <button
        onClick={submit}
        disabled={pending || balance <= 0 || !amount || parseFloat(amount) > balance || parseFloat(amount) <= 0}
        className="mt-3 w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Requesting…" : `Withdraw ${amount ? formatMoney(parseFloat(amount) || 0) : ""}`}
      </button>

      {balance <= 0 && <p className="mt-2 text-xs text-muted">Sell an item to build up a balance.</p>}
      {msg?.ok && <p className="mt-2 text-xs text-brand">{msg.ok}</p>}
      {msg?.err && <p className="mt-2 text-xs text-red-500">{msg.err}</p>}
    </div>
  );
}
