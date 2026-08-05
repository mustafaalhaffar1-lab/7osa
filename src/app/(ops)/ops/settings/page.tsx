import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SettingsForms } from "./SettingsForms";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const me = await getUser();

  const [{ data: settings }, { data: tiers }, { data: zones }, { data: categories }, { data: amAdmin }] =
    await Promise.all([
      supabase.from("settings").select("key, value"),
      supabase.from("commission_tiers").select("id, min_price, max_price, marketplace_pct, active").order("min_price"),
      supabase.from("zones").select("id, name, emirate, active").order("name"),
      supabase.from("categories").select("id, name, possession_default, active").order("name"),
      me ? supabase.rpc("is_admin", { uid: me.id }) : Promise.resolve({ data: false } as const),
    ]);

  const byKey = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const floor = ((byKey.get("value_floor") ?? {}) as { amount?: number }).amount ?? 500;
  const markdown = (byKey.get("markdown_clock") ?? {}) as {
    days_to_first_drop?: number;
    drop_pct?: number;
    interval_days?: number;
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        {amAdmin
          ? "Every business rule, editable without a developer."
          : "Read-only for your role — changes need an admin."}
      </p>
      <SettingsForms
        amAdmin={Boolean(amAdmin)}
        floor={floor}
        markdown={{
          days: markdown.days_to_first_drop ?? 14,
          pct: markdown.drop_pct ?? 10,
          interval: markdown.interval_days ?? 10,
        }}
        tiers={(tiers ?? []).map((t) => ({
          id: t.id,
          minPrice: Number(t.min_price),
          maxPrice: t.max_price != null ? Number(t.max_price) : null,
          marketplacePct: Number(t.marketplace_pct),
          active: t.active,
        }))}
        zones={zones ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
