"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ConditionGrade } from "@/lib/domain/enums";
import type { ItemStatus } from "@/lib/domain/item-state";

async function ensureStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: staff } = await supabase.rpc("is_staff", { uid: user.id });
  return { supabase, ok: Boolean(staff) };
}

export async function opsSetStatus(itemId: string, to: ItemStatus) {
  const { supabase, ok } = await ensureStaff();
  if (!ok) return { error: "Not authorized." };
  const { error } = await supabase.rpc("ops_set_status", { p_item_id: itemId, p_to: to });
  if (error) return { error: error.message };
  revalidatePath("/ops");
  revalidatePath("/ops/receiving");
  revalidatePath(`/ops/inventory/products/${itemId}`);
  return {};
}

export async function opsInspect(
  itemId: string,
  input: { condition: ConditionGrade; functional: boolean; dataWipe: boolean; notes: string }
) {
  const { supabase, ok } = await ensureStaff();
  if (!ok) return { error: "Not authorized." };
  const { error } = await supabase.rpc("ops_record_inspection", {
    p_item_id: itemId,
    p_condition: input.condition,
    p_functional: input.functional,
    p_data_wipe: input.dataWipe,
    p_notes: input.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/ops");
  revalidatePath("/ops/receiving");
  revalidatePath(`/ops/inventory/products/${itemId}`);
  return {};
}

export async function opsList(itemId: string, listPrice: number) {
  const { supabase, ok } = await ensureStaff();
  if (!ok) return { error: "Not authorized." };
  const { error } = await supabase.rpc("ops_list_item", { p_item_id: itemId, p_list_price: listPrice });
  if (error) return { error: error.message };
  revalidatePath("/ops");
  revalidatePath("/ops/receiving");
  revalidatePath("/ops/inventory/products");
  revalidatePath(`/ops/inventory/products/${itemId}`);
  revalidatePath("/shop");
  return {};
}
