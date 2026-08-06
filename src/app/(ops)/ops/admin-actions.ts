"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, AppRole, ConditionGrade } from "@/lib/domain/enums";
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

export async function setVisitStatus(visitId: string, status: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_visit_status", { p_visit_id: visitId, p_status: status });
  if (error) return { error: error.message };
  revalidatePath("/ops/visits");
  return {};
}

export async function addItemFromVisit(input: {
  visitId: string;
  title: string;
  categoryId: string | null;
  brand: string;
  condition: ConditionGrade;
  estimateMin: number;
  estimateMax: number;
  sellerMinPrice: number | null;
  retailPrice: number | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_add_item_from_visit", {
    p_visit_id: input.visitId,
    p_title: input.title,
    p_category_id: input.categoryId,
    p_brand: input.brand || null,
    p_condition: input.condition,
    p_estimate_min: input.estimateMin,
    p_estimate_max: input.estimateMax,
    p_seller_min_price: input.sellerMinPrice,
    p_retail_price: input.retailPrice,
  });
  if (error) return { error: error.message };
  revalidatePath(`/ops/visits/${input.visitId}`);
  revalidatePath("/ops/pipeline");
  return {};
}

export async function acceptOffer(offerId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_accept_offer", { p_offer_id: offerId });
  if (error) return { error: error.message };
  revalidatePath("/ops/offers");
  return {};
}

export async function declineOffer(offerId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_decline_offer", { p_offer_id: offerId });
  if (error) return { error: error.message };
  revalidatePath("/ops/offers");
  return {};
}

export async function assignJob(jobId: string, driverId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_assign_job", { p_job_id: jobId, p_driver_id: driverId });
  if (error) return { error: error.message };
  revalidatePath("/ops/logistics");
  return {};
}

export async function setJobStatus(
  jobId: string,
  status: "unassigned" | "assigned" | "en_route" | "completed" | "failed"
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_job_status", { p_job_id: jobId, p_status: status });
  if (error) return { error: error.message };
  revalidatePath("/ops/logistics");
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
  revalidatePath("/ops/settings");
  revalidatePath(`/ops/customers/${userId}`);
  return {};
}

export async function grantStaffByEmail(email: string, role: AppRole): Promise<Result> {
  if (!email.trim()) return { error: "Enter an email." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_grant_staff_by_email", { p_email: email.trim(), p_role: role });
  if (error) return { error: error.message };
  revalidatePath("/ops/settings");
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
