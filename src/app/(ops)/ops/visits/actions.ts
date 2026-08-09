"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export async function setVisitStage(visitId: string, stageId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_set_visit_stage", {
    p_visit_id: visitId,
    p_stage_id: stageId,
  });
  if (error) return { error: error.message };
  revalidatePath("/ops/visits");
  revalidatePath(`/ops/visits/${visitId}`);
  revalidatePath("/ops/logistics");
  return {};
}

export async function saveStage(input: {
  id: string | null;
  name: string;
  sequence: number;
  mapsToStatus: string | null;
  isClosed: boolean;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_save_visit_stage", {
    p_id: input.id,
    p_name: input.name,
    p_sequence: input.sequence,
    p_maps_to_status: input.mapsToStatus,
    p_is_closed: input.isClosed,
  });
  if (error) return { error: error.message };
  revalidatePath("/ops/visits");
  return {};
}

export async function deleteStage(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_delete_visit_stage", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath("/ops/visits");
  return {};
}
