"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, AppRole } from "@/lib/domain/enums";
import type { ItemStatus, PossessionMode } from "@/lib/domain/item-state";

type Result = { error?: string };

/** All authorization is enforced in the database (RLS + gated RPCs); actions stay thin. */

export async function setItemPrice(itemId: string, price: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_price", { p_item_id: itemId, p_price: price });
  if (error) return { error: error.message };
  revalidatePath("/ops/products");
  return {};
}

export async function overrideItemStatus(itemId: string, to: ItemStatus): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_status", { p_item_id: itemId, p_to: to });
  if (error) return { error: error.message };
  revalidatePath("/ops/products");
  return {};
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_order_status", { p_order_id: orderId, p_status: status });
  if (error) return { error: error.message };
  revalidatePath("/ops/orders");
  return {};
}

export async function processPayout(payoutId: string, status: "paid" | "failed"): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_process_payout", { p_payout_id: payoutId, p_status: status });
  if (error) return { error: error.message };
  revalidatePath("/ops");
  return {};
}

export async function setStaffRole(userId: string, role: AppRole, grant: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_staff_role", { p_user_id: userId, p_role: role, p_grant: grant });
  if (error) return { error: error.message };
  revalidatePath("/ops/users");
  return {};
}

export async function updateValueFloor(amount: number): Promise<Result> {
  if (!Number.isFinite(amount) || amount < 0) return { error: "Invalid amount." };
  const supabase = await createClient();
  const { error } = await supabase.from("settings").update({ value: { amount } }).eq("key", "value_floor");
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}

export async function updateMarkdownClock(days: number, pct: number, interval: number): Promise<Result> {
  if ([days, pct, interval].some((n) => !Number.isFinite(n) || n <= 0)) return { error: "All values must be positive." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ value: { days_to_first_drop: days, drop_pct: pct, interval_days: interval } })
    .eq("key", "markdown_clock");
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}

export async function updateTierPct(tierId: string, pct: number): Promise<Result> {
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return { error: "Percentage must be between 0 and 100." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("commission_tiers")
    .update({ marketplace_pct: pct / 100 })
    .eq("id", tierId);
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}

export async function addZone(name: string): Promise<Result> {
  if (!name.trim()) return { error: "Zone name required." };
  const supabase = await createClient();
  const { error } = await supabase.from("zones").insert({ name: name.trim() });
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}

export async function setZoneActive(id: string, active: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("zones").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}

export async function addCategory(name: string, possession: PossessionMode): Promise<Result> {
  if (!name.trim()) return { error: "Category name required." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name: name.trim(), possession_default: possession });
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}

export async function setCategoryActive(id: string, active: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
  return {};
}
