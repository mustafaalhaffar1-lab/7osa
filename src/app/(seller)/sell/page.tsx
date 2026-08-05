import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { SellWizard } from "./SellWizard";

export const metadata = { title: `Sell - ${BRAND.name}` };

export default async function SellPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: categories }, { data: zones }] = await Promise.all([
    supabase.from("categories").select("id, name, possession_default").eq("active", true).order("name"),
    supabase.from("zones").select("id, name").eq("active", true).order("name"),
  ]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <SellWizard categories={categories ?? []} zones={zones ?? []} />
    </div>
  );
}
