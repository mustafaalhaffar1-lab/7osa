import { ArrowDownLeft, ArrowUpRight, Clock, Wallet as WalletIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { CashOut } from "./CashOut";

export const dynamic = "force-dynamic";

const TXN_LABEL: Record<string, string> = {
  sale_credit: "Item sold",
  payout: "Withdrawal",
  bonus: "Bonus",
  promotion_spend: "Promotion",
  adjustment: "Adjustment",
  refund_reversal: "Refund",
};

const PAYOUT_LABEL: Record<string, string> = {
  requested: "Requested",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
};

export default async function WalletPage() {
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: wallet }, { data: txns }, { data: payouts }, { data: heldOrders }, { data: profile }] = await Promise.all([
    supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("wallet_transactions")
      .select("id, amount, type, memo, balance_after, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("payouts").select("id, amount, method, status, created_at").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, seller_payout, payout_release_at, items!inner(seller_id)")
      .eq("payout_status", "held")
      .eq("items.seller_id", user!.id),
    supabase.from("profiles").select("bank_iban, bank_holder").eq("id", user!.id).maybeSingle(),
  ]);

  const balance = Number(wallet?.balance ?? 0);
  const earned = (txns ?? [])
    .filter((t) => Number(t.amount) > 0 && t.type === "sale_credit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const pending = (heldOrders ?? []).reduce((s, o) => s + Number(o.seller_payout), 0);
  const nextRelease = (heldOrders ?? [])
    .map((o) => o.payout_release_at)
    .filter(Boolean)
    .sort()[0] as string | undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Wallet</h1>
        <p className="mt-0.5 text-sm text-muted">Your earnings from {BRAND.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-brand p-6 text-brand-fg shadow-card">
          <div className="mb-1 inline-flex items-center gap-2 text-sm opacity-90">
            <WalletIcon size={15} /> Available balance
          </div>
          <div className="text-4xl font-bold tracking-tight">{formatMoney(balance)}</div>
          <div className="mt-1 text-sm opacity-80">{formatMoney(earned)} earned all-time</div>
          {pending > 0 && (
            <div className="mt-3 rounded-xl bg-brand-fg/10 px-3 py-2 text-sm">
              <span className="font-semibold">{formatMoney(pending)} on the way</span>
              <span className="block text-xs opacity-80">
                Clears once the buyer&apos;s return window closes
                {nextRelease
                  ? ` — from ${new Date(nextRelease).toLocaleDateString(BRAND.locale, { day: "numeric", month: "short" })}`
                  : ""}
              </span>
            </div>
          )}
        </div>
        <CashOut balance={balance} iban={profile?.bank_iban} holder={profile?.bank_holder} />
      </div>

      {payouts && payouts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted">Withdrawals</h2>
          <ul className="mt-2 space-y-2">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Clock size={14} className="text-muted" />
                  {new Date(p.created_at).toLocaleDateString(BRAND.locale)} · to {p.method}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{formatMoney(Number(p.amount))}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "paid"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : p.status === "failed"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-accent/10 text-accent"
                    }`}
                  >
                    {PAYOUT_LABEL[p.status] ?? p.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-muted">Activity</h2>
        {!txns?.length ? (
          <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            No activity yet — your sales will show up here.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {txns.map((t) => {
              const positive = Number(t.amount) >= 0;
              return (
                <li key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${positive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted/10 text-muted"}`}>
                      {positive ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium">{TXN_LABEL[t.type] ?? t.type}</div>
                      <div className="truncate text-xs text-muted">
                        {t.memo ?? ""} · {new Date(t.created_at).toLocaleDateString(BRAND.locale)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`font-semibold ${positive ? "text-green-600 dark:text-green-400" : ""}`}>
                      {positive ? "+" : "−"}
                      {formatMoney(Math.abs(Number(t.amount)))}
                    </div>
                    <div className="text-xs text-muted">bal {formatMoney(Number(t.balance_after))}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
