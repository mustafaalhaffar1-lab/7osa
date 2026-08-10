"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Pencil } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { requestPayout, saveBankDetails } from "./actions";

export function CashOut({
  balance,
  iban,
  holder,
}: {
  balance: number;
  iban?: string | null;
  holder?: string | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null);

  // Money can't move without an IBAN, so ask for it here rather than failing at submit.
  const [editingBank, setEditingBank] = useState(!iban);
  const [ibanInput, setIbanInput] = useState(iban ?? "");
  const [holderInput, setHolderInput] = useState(holder ?? "");

  function saveBank() {
    setMsg(null);
    start(async () => {
      const res = await saveBankDetails(ibanInput, holderInput);
      if ("error" in res) setMsg({ err: res.error });
      else {
        setEditingBank(false);
        setMsg({ ok: "Bank details saved." });
        router.refresh();
      }
    });
  }

  function submit() {
    setMsg(null);
    const n = parseFloat(amount);
    start(async () => {
      const res = await requestPayout(n);
      if ("error" in res) setMsg({ err: res.error });
      else {
        setMsg({ ok: "Withdrawal requested — we'll transfer it within 2 business days." });
        setAmount("");
        router.refresh();
      }
    });
  }

  const masked = iban ? `•••• ${iban.slice(-4)}` : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="text-sm font-semibold">Cash out</div>
      <p className="mt-0.5 text-xs text-muted">Withdraw to your UAE bank account.</p>

      {editingBank ? (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-bg p-3">
          <div className="text-xs font-medium">Where should we send it?</div>
          <input
            value={holderInput}
            onChange={(e) => setHolderInput(e.target.value)}
            placeholder="Account holder name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            value={ibanInput}
            onChange={(e) => setIbanInput(e.target.value)}
            placeholder="AE00 0000 0000 0000 0000 000"
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <button
              onClick={saveBank}
              disabled={pending || !ibanInput || !holderInput}
              className="flex-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save bank details"}
            </button>
            {iban && (
              <button
                onClick={() => setEditingBank(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingBank(true)}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-left text-xs transition-colors hover:border-ink"
        >
          <Landmark size={14} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{holder}</span>
            <span className="font-mono text-muted">{masked}</span>
          </span>
          <Pencil size={12} className="shrink-0 text-muted" />
        </button>
      )}

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
        disabled={
          pending ||
          !iban ||
          balance <= 0 ||
          !amount ||
          parseFloat(amount) > balance ||
          parseFloat(amount) <= 0
        }
        className="mt-3 w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Requesting…" : `Withdraw ${amount ? formatMoney(parseFloat(amount) || 0) : ""}`}
      </button>

      {!iban && <p className="mt-2 text-xs text-muted">Add your bank details to withdraw.</p>}
      {iban && balance <= 0 && <p className="mt-2 text-xs text-muted">Sell an item to build up a balance.</p>}
      {msg?.ok && <p className="mt-2 text-xs text-brand">{msg.ok}</p>}
      {msg?.err && <p className="mt-2 text-xs text-red-500">{msg.err}</p>}
    </div>
  );
}
