"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestPayout(amount: number): Promise<{ ok: true } | { error: string }> {
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase.rpc("request_payout", { p_amount: amount, p_method: "bank" });
  if (error) return { error: error.message };
  revalidatePath("/wallet");
  return { ok: true };
}
