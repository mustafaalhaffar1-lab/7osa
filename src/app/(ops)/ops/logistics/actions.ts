"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };
type Stage = "unassigned" | "assigned" | "en_route" | "arrived" | "completed" | "failed";

export async function dispatchJob(
  jobId: string,
  assignee: { driverId?: string | null; carrierId?: string | null; trackingRef?: string }
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_dispatch_job", {
    p_job_id: jobId,
    p_driver_id: assignee.driverId ?? null,
    p_carrier_id: assignee.carrierId ?? null,
    p_tracking_ref: assignee.trackingRef ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/ops/logistics");
  return {};
}

export async function scheduleJob(
  jobId: string,
  date: string,
  slot?: string,
  sequence?: number
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ops_schedule_job", {
    p_job_id: jobId,
    p_date: date,
    p_slot: slot ?? null,
    p_sequence: sequence ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/ops/logistics");
  return {};
}

export async function advanceJob(
  jobId: string,
  status: Stage,
  extra?: { notes?: string; proofUrl?: string; failureReason?: string }
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_job", {
    p_job_id: jobId,
    p_status: status,
    p_notes: extra?.notes ?? null,
    p_proof_url: extra?.proofUrl ?? null,
    p_failure_reason: extra?.failureReason ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/ops/logistics");
  revalidatePath("/driver");
  return {};
}
