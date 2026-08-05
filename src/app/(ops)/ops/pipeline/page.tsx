import { createClient } from "@/lib/supabase/server";
import { OpsBoard, type OpsItem } from "../OpsBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select(
      "id, title, brand, status, possession, condition_grade, ai_estimate_min, ai_estimate_max, list_price, item_photos(url)"
    )
    .order("created_at", { ascending: false });

  return <OpsBoard items={(items as OpsItem[]) ?? []} />;
}
