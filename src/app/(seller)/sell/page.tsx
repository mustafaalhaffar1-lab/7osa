import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { SellPitch } from "./SellPitch";
import { SellWizard } from "./SellWizard";

export const metadata = { title: `Sell with ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function SellPage() {
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: categories }, { data: zones }, { data: tiers }, { data: settingRows }] =
    await Promise.all([
      supabase.from("categories").select("id, name, possession_default").eq("active", true).order("name"),
      supabase.from("zones").select("id, name").eq("active", true).order("name"),
      supabase.from("commission_tiers").select("min_price, max_price, marketplace_pct").eq("active", true).order("min_price"),
      supabase.from("settings").select("key, value").in("key", ["value_floor", "launch_scope"]),
    ]);

  const byKey = new Map((settingRows ?? []).map((s) => [s.key, s.value]));
  const floor = ((byKey.get("value_floor") ?? {}) as { amount?: number }).amount ?? 500;
  const scope = (byKey.get("launch_scope") ?? {}) as {
    max_weight_kg?: number;
    max_longest_side_cm?: number;
  };
  // Admin-configured intake limits actually govern the wizard.
  const limits = {
    maxWeightKg: scope.max_weight_kg ?? 40,
    maxLongestSideCm: scope.max_longest_side_cm ?? 180,
    valueFloor: floor,
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <SellPitch tiers={tiers ?? []} floor={floor} isAuthed={Boolean(user)} />

      {user ? (
        <section id="list" className="mx-auto max-w-2xl scroll-mt-24 px-6 pb-4">
          <div className="rounded-3xl border border-border bg-surface p-2">
            <div className="px-4 pt-4">
              <h2 className="text-xl font-semibold tracking-tight">List your item</h2>
              <p className="mt-1 text-sm text-muted">Tell us what it is — you&apos;ll get a quote in seconds.</p>
            </div>
            <SellWizard categories={categories ?? []} zones={zones ?? []} limits={limits} />
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-3xl bg-brand px-8 py-10 text-center text-brand-fg">
            <h2 className="text-2xl font-semibold tracking-tight">Ready to turn clutter into cash?</h2>
            <p className="mx-auto mt-2 max-w-md text-brand-fg/80">
              Create your free account and list your first item in minutes. No fees to join — we only
              earn when your item sells.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-bg px-6 py-3 font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Create an account <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted sm:flex-row">
          <span>© {BRAND.name} — {BRAND.city}, UAE</span>
          <span>{BRAND.supportEmail}</span>
        </div>
      </footer>
    </div>
  );
}
