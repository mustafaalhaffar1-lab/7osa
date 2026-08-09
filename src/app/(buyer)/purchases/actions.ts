"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reportProblem(
  orderId: string,
  reason: string,
  description: string
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_return", {
    p_order_id: orderId,
    p_reason: reason,
    p_description: description || null,
    p_photos: null,
  });
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  return { ok: true };
}
