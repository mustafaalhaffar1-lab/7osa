import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SettingsForms } from "./SettingsForms";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const me = await getUser();

  const [{ data: settings }, { data: tiers }, { data: zones }, { data: categories }, { data: amAdmin }, { data: allUsers }] =
    await Promise.all([
      supabase.from("settings").select("key, value"),
      supabase.from("commission_tiers").select("id, min_price, max_price, marketplace_pct, active").order("min_price"),
      supabase.from("zones").select("id, name, emirate, active").order("name"),
      supabase.from("categories").select("id, name, possession_default, active").order("name"),
      me ? supabase.rpc("is_admin", { uid: me.id }) : Promise.resolve({ data: false } as const),
      supabase.rpc("ops_list_users"),
    ]);

  const staff = ((allUsers as { id: string; email: string; full_name: string | null; roles: string[] }[]) ?? [])
    .filter((u) => u.roles.length > 0)
    .map((u) => ({ id: u.id, email: u.email, fullName: u.full_name, roles: u.roles }));

  const byKey = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const floor = ((byKey.get("value_floor") ?? {}) as { amount?: number }).amount ?? 500;
  const markdown = (byKey.get("markdown_clock") ?? {}) as {
    days_to_first_drop?: number;
    drop_pct?: number;
    interval_days?: number;
  };
  const scope = (byKey.get("launch_scope") ?? {}) as {
    max_weight_kg?: number;
    max_longest_side_cm?: number;
  };
  const visitFee = ((byKey.get("visit_fee") ?? {}) as { amount?: number }).amount ?? 50;
  const delivery = (byKey.get("delivery_fee") ?? {}) as { amount?: number; free_above?: number };
  const tax = (byKey.get("tax") ?? {}) as { vat_pct?: number; prices_include_vat?: boolean; trn?: string };
  const business = (byKey.get("business") ?? {}) as {
    name?: string;
    support_email?: string;
    city?: string;
    phone?: string;
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
        staff={staff}
        myId={me?.id ?? ""}
        scope={{
          maxWeightKg: scope.max_weight_kg ?? 40,
          maxLongestSideCm: scope.max_longest_side_cm ?? 180,
        }}
        visitFee={visitFee}
        delivery={{ amount: delivery.amount ?? 0, freeAbove: delivery.free_above ?? 0 }}
        tax={{
          vatPct: tax.vat_pct ?? 5,
          pricesIncludeVat: tax.prices_include_vat ?? true,
          trn: tax.trn ?? "",
        }}
        business={{
          name: business.name ?? "Hoosa",
          supportEmail: business.support_email ?? "",
          city: business.city ?? "Dubai",
          phone: business.phone ?? "",
        }}
      />
    </div>
  );
}
