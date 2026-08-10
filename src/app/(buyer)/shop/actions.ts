"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Delivery = {
  phone: string;
  building: string;
  unit: string;
  area: string;
  address: string;
  makani: string;
  mapsUrl: string;
  accessNotes: string;
};

/** Shape the delivery details the way the settle_sale RPC expects them. */
function deliveryPayload(d?: Delivery) {
  if (!d) return {};
  return {
    phone: d.phone,
    building: d.building,
    unit: d.unit,
    area: d.area,
    address: d.address,
    makani: d.makani,
    maps_url: d.mapsUrl,
    access_notes: d.accessNotes,
  };
}

export async function purchaseItem(
  itemId: string,
  delivery?: Delivery
): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to buy." };

  const { data, error } = await supabase.rpc("purchase_item", {
    p_item_id: itemId,
    p_delivery: deliveryPayload(delivery),
  });
  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/account/orders");
  return { orderId: data as string };
}

/** Address we already know about, so checkout is one tap for repeat buyers. */
export async function myDeliveryDefaults(): Promise<Partial<Delivery>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("profiles")
    .select("phone, default_building, default_unit, default_area, default_makani, default_maps_url, default_access_notes")
    .eq("id", user.id)
    .maybeSingle();
  return {
    phone: data?.phone ?? "",
    building: data?.default_building ?? "",
    unit: data?.default_unit ?? "",
    area: data?.default_area ?? "",
    makani: data?.default_makani ?? "",
    mapsUrl: data?.default_maps_url ?? "",
    accessNotes: data?.default_access_notes ?? "",
  };
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
