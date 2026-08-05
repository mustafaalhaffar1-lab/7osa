"use server";

import { createClient } from "@/lib/supabase/server";
import type { ConditionGrade } from "@/lib/domain/enums";
import type { PossessionMode } from "@/lib/domain/item-state";

export interface CreateListingInput {
  title: string;
  categoryId: string | null;
  brand: string;
  model: string;
  condition: ConditionGrade;
  possession: PossessionMode;
  weightKg: number | null;
  longestSideCm: number | null;
  estimateMin: number;
  estimateMax: number;
  confidence: number;
  retailPrice: number | null;
  sellerMinPrice: number | null;
  zoneId: string | null;
  address: string;
  photoUrls: string[];
}

export type CreateListingResult = { itemId: string } | { error: string };

/** Persist a concierge-approved listing via the create_intake RPC (runs as the seller). */
export async function createListing(input: CreateListingInput): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to create a listing." };

  // Default pickup window: tomorrow, a 3-hour slot. (Real slot picking comes with the zone
  // scheduler milestone.)
  const from = new Date(Date.now() + 24 * 3600 * 1000);
  from.setHours(10, 0, 0, 0);
  const to = new Date(from.getTime() + 3 * 3600 * 1000);

  const { data, error } = await supabase.rpc("create_intake", {
    p_title: input.title,
    p_category_id: input.categoryId,
    p_brand: input.brand || null,
    p_model: input.model || null,
    p_condition: input.condition,
    p_possession: input.possession,
    p_weight_kg: input.weightKg,
    p_longest_side_cm: input.longestSideCm,
    p_estimate_min: input.estimateMin,
    p_estimate_max: input.estimateMax,
    p_confidence: input.confidence,
    p_retail_price: input.retailPrice,
    p_seller_min_price: input.sellerMinPrice,
    p_zone_id: input.zoneId,
    p_address: input.address || null,
    p_photo_urls: input.photoUrls.length ? input.photoUrls : null,
    p_pickup_from: from.toISOString(),
    p_pickup_to: to.toISOString(),
  });

  if (error) return { error: error.message };
  return { itemId: data as string };
}
