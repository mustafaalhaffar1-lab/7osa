"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function bookVisit(input: {
  zoneId: string | null;
  address: string;
  date: string;
  slot: "morning" | "afternoon" | "evening";
  notes: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to book a visit." };

  const { error } = await supabase.rpc("book_pickup_visit", {
    p_zone_id: input.zoneId,
    p_address: input.address,
    p_date: input.date,
    p_slot: input.slot,
    p_notes: input.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/sell/visit");
  revalidatePath("/my-items");
  return { ok: true };
}
