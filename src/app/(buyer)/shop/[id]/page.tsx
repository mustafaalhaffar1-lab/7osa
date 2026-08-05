import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { BuyPanel } from "./BuyPanel";

export const dynamic = "force-dynamic";

const CONDITION_LABEL: Record<string, string> = {
  new: "New", like_new: "Like new", excellent: "Excellent", good: "Good", fair: "Fair",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*, item_photos(url, sort), inspections(condition_grade, functional_test_passed, data_wipe_certified, notes, created_at), price_history(price, reason, created_at)")
    .eq("id", id)
    .in("status", ["listed", "reserved"])
    .maybeSingle();

  if (!item) notFound();

  const user = await getUser();
  const photos = ((item.item_photos as { url: string; sort: number }[]) ?? []).sort((a, b) => a.sort - b.sort);
  const inspection = ((item.inspections as { condition_grade: string | null; functional_test_passed: boolean | null; data_wipe_certified: boolean | null; notes: string | null; created_at: string }[]) ?? [])[0];
  const history = ((item.price_history as { price: number; reason: string; created_at: string }[]) ?? [])
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  // Markdown clock (public settings)
  const { data: mk } = await supabase.from("settings").select("value").eq("key", "markdown_clock").maybeSingle();
  const markdown = (mk?.value ?? {}) as { days_to_first_drop?: number; drop_pct?: number };
  let nextDrop: { days: number; pct: number } | null = null;
  if (item.listed_at && markdown.days_to_first_drop) {
    const dropDate = new Date(new Date(item.listed_at).getTime() + markdown.days_to_first_drop * 86400000);
    const days = Math.ceil((dropDate.getTime() - Date.now()) / 86400000);
    if (days > 0) nextDrop = { days, pct: markdown.drop_pct ?? 10 };
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft size={15} /> Shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-surface">
              {photos[0]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photos[0].url} alt={item.title} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center text-muted">No photo</div>}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2">
                {photos.slice(1, 5).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.url} src={p.url} alt="" className="h-16 w-16 rounded-xl border border-border object-cover" />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {item.brand && <div className="text-sm text-muted">{item.brand}</div>}
            <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>

            <div className="mt-4 flex items-end gap-3">
              <div className="text-3xl font-semibold">{item.list_price != null ? formatMoney(item.list_price) : "—"}</div>
              {item.retail_price != null && item.list_price != null && item.retail_price > item.list_price && (
                <div className="pb-1 text-sm text-muted line-through">{formatMoney(item.retail_price)} retail</div>
              )}
            </div>

            {nextDrop && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                Price drops {nextDrop.pct}% in {nextDrop.days} day{nextDrop.days === 1 ? "" : "s"} if unsold
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <Badge icon={<BadgeCheck size={13} />}>
                {inspection?.condition_grade ? CONDITION_LABEL[inspection.condition_grade] : (item.condition_grade ? CONDITION_LABEL[item.condition_grade] : "Inspected")}
              </Badge>
              <Badge icon={<ShieldCheck size={13} />}>Inspected & certified</Badge>
              <Badge icon={<Truck size={13} />}>Delivery in {BRAND.city}, 2–3 days</Badge>
            </div>

            <div className="mt-6">
              <BuyPanel itemId={item.id} price={item.list_price} isAuthed={Boolean(user)} />
            </div>

            {/* Condition report */}
            {inspection && (
              <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-sm font-semibold">Condition report</h2>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  <li>Grade: <span className="text-ink">{inspection.condition_grade ? CONDITION_LABEL[inspection.condition_grade] : "—"}</span></li>
                  {inspection.functional_test_passed != null && (
                    <li>Functional test: <span className="text-ink">{inspection.functional_test_passed ? "Passed" : "Failed"}</span></li>
                  )}
                  {inspection.data_wipe_certified != null && (
                    <li>Data wipe: <span className="text-ink">{inspection.data_wipe_certified ? "Certified" : "N/A"}</span></li>
                  )}
                  {inspection.notes && <li>Notes: <span className="text-ink">{inspection.notes}</span></li>}
                </ul>
              </div>
            )}

            {/* Price history */}
            {history.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-sm font-semibold">Price history</h2>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {history.map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{new Date(h.created_at).toLocaleDateString(BRAND.locale)} · {h.reason}</span>
                      <span className="text-ink">{formatMoney(h.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-muted">
      {icon} {children}
    </span>
  );
}
