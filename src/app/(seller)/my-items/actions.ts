"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export async function updateMyItem(
  itemId: string,
  input: { minPrice?: number | null; pref?: string | null; autoAccept?: number | null }
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_update_item", {
    p_item_id: itemId,
    p_min_price: input.minPrice ?? null,
    p_pref: input.pref ?? null,
    p_auto_accept: input.autoAccept ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/my-items");
  return {};
}

export async function withdrawMyItem(itemId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_withdraw_item", { p_item_id: itemId });
  if (error) return { error: error.message };
  revalidatePath("/my-items");
  return {};
}
