"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(input: {
  fullName: string;
  phone: string;
  building: string;
  unit: string;
  area: string;
  makani: string;
  mapsUrl: string;
  accessNotes: string;
}): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim() || null,
      phone: input.phone.trim() || null,
      default_building: input.building.trim() || null,
      default_unit: input.unit.trim() || null,
      default_area: input.area.trim() || null,
      default_makani: input.makani.trim() || null,
      default_maps_url: input.mapsUrl.trim() || null,
      default_access_notes: input.accessNotes.trim() || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account/profile");
  revalidatePath("/account");
  return { ok: true };
}
