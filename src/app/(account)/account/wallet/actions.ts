"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** UAE IBANs are AE + 2 check digits + 19 digits. Reject early, in plain language. */
function normalizeIban(raw: string): string | null {
  const v = raw.replace(/\s+/g, "").toUpperCase();
  return /^AE\d{21}$/.test(v) ? v : null;
}

export async function saveBankDetails(
  iban: string,
  holder: string
): Promise<{ ok: true } | { error: string }> {
  const clean = normalizeIban(iban);
  if (!clean) return { error: "That doesn't look like a UAE IBAN — it should start with AE and have 23 characters." };
  if (holder.trim().length < 3) return { error: "Enter the account holder's full name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({ bank_iban: clean, bank_holder: holder.trim() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account/wallet");
  return { ok: true };
}

export async function requestPayout(amount: number): Promise<{ ok: true } | { error: string }> {
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase.rpc("request_payout", { p_amount: amount, p_method: "bank" });
  if (error) return { error: error.message };
  revalidatePath("/account/wallet");
  revalidatePath("/account");
  return { ok: true };
}
