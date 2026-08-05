"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function purchaseItem(itemId: string): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to buy." };

  const { data, error } = await supabase.rpc("purchase_item", { p_item_id: itemId });
  if (error) return { error: error.message };
  revalidatePath("/shop");
  return { orderId: data as string };
}

export async function makeOffer(itemId: string, amount: number): Promise<{ ok: true } | { error: string }> {
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to make an offer." };

  const expires = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  const { error } = await supabase.from("offers").insert({
    item_id: itemId,
    buyer_id: user.id,
    amount,
    status: "pending",
    expires_at: expires,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
