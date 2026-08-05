import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { OpsBoard, type OpsItem } from "./OpsBoard";

export const metadata = { title: `Ops - ${BRAND.name}` };

export default async function OpsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: staff } = await supabase.rpc("is_staff", { uid: user.id });

  if (!staff) {
    return (
      <div className="min-h-screen bg-bg text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="text-xl font-semibold">Staff only</h1>
          <p className="mt-2 text-muted">This area is for {BRAND.name} operations staff.</p>
        </main>
      </div>
    );
  }

  const { data: items } = await supabase
    .from("items")
    .select("id, title, brand, status, possession, condition_grade, ai_estimate_min, ai_estimate_max, list_price, item_photos(url)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <OpsBoard items={(items as OpsItem[]) ?? []} />
    </div>
  );
}
