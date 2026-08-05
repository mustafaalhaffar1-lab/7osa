import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Sparkles,
  Eye,
  Heart,
  Timer,
  Package,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard, type CardItem } from "@/components/store/ProductCard";
import { CARD_SELECT, toCardItems } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { BuyPanel } from "./BuyPanel";
import { Gallery } from "./Gallery";

export const dynamic = "force-dynamic";

const CONDITION_LABEL: Record<string, string> = {
  new: "New", like_new: "Like new", excellent: "Excellent", good: "Good", fair: "Fair",
};

function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select(
      "*, item_photos(url, sort), inspections(condition_grade, functional_test_passed, data_wipe_certified, notes, created_at), price_history(price, reason, created_at), item_metrics(views, saves)"
    )
    .eq("id", id)
    .in("status", ["listed", "reserved"])
    .maybeSingle();

  if (!item) notFound();

  // Real view tracking — powers "N viewed" here and "Selling fast" on the homepage.
  await supabase.rpc("record_item_view", { p_item_id: id }).then(
    () => {},
    () => {}
  );

  const user = await getUser();
  const photos = ((item.item_photos as { url: string; sort: number }[]) ?? [])
    .sort((a, b) => a.sort - b.sort)
    .map((p) => p.url);
  const inspection = ((item.inspections as {
    condition_grade: string | null;
    functional_test_passed: boolean | null;
    data_wipe_certified: boolean | null;
    notes: string | null;
  }[]) ?? [])[0];
  const history = ((item.price_history as { price: number; reason: string; created_at: string }[]) ?? [])
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const metricsRaw = item.item_metrics as { views: number; saves: number } | { views: number; saves: number }[] | null;
  const metrics = Array.isArray(metricsRaw) ? metricsRaw[0] : metricsRaw;
  const views = (metrics?.views ?? 0) + 1; // include this visit
  const saves = metrics?.saves ?? 0;

  const price = item.list_price as number | null;
  const retail = item.retail_price as number | null;
  const saveAmount = retail != null && price != null && retail > price ? retail - price : null;
  const discountPct = saveAmount != null && retail ? Math.round((saveAmount / retail) * 100) : null;

  // Markdown clock → next scheduled price
  const { data: mk } = await supabase.from("settings").select("value").eq("key", "markdown_clock").maybeSingle();
  const markdown = (mk?.value ?? {}) as { days_to_first_drop?: number; drop_pct?: number };
  const dropPct = markdown.drop_pct ?? 10;
  let nextDrop: { days: number; date: Date; price: number } | null = null;
  if (item.sell_by && price != null) {
    const date = new Date(item.sell_by as string);
    const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
    if (days > 0) nextDrop = { days, date, price: round5(price * (1 - dropPct / 100)) };
  }

  const conditionLabel = inspection?.condition_grade
    ? CONDITION_LABEL[inspection.condition_grade]
    : item.condition_grade
      ? CONDITION_LABEL[item.condition_grade as string]
      : null;

  // Recommendations — three carousels with different logic, no repeated items across them.
  const { data: otherRows } = await supabase
    .from("items")
    .select(CARD_SELECT)
    .eq("status", "listed")
    .neq("id", id)
    .limit(40);
  const others = toCardItems(otherRows as never);
  const usedIds = new Set<string>();
  function take(pool: CardItem[], cap = 8): CardItem[] {
    const out = pool.filter((i) => !usedIds.has(i.id)).slice(0, cap);
    out.forEach((i) => usedIds.add(i.id));
    return out;
  }
  const similar = take(others.filter((i) => i.categoryId === item.category_id));
  const deals = take(
    [...others].sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0)).filter((i) => (i.discountPct ?? 0) > 0)
  );
  const fresh = take(others);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <main>
      {/* Tinted hero band — separates the product stage from the rest of the page */}
      <div className="border-b border-border bg-brand/[0.045] dark:bg-brand/[0.07]">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft size={15} /> Keep browsing
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <Gallery photos={photos} title={item.title as string} />

            <div>
              {item.brand ? <div className="text-sm font-medium text-muted">{item.brand as string}</div> : null}
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{item.title as string}</h1>

              {/* PRICE — the first thing the eye lands on */}
              <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                <div className="text-4xl font-bold tracking-tight">{price != null ? formatMoney(price) : "—"}</div>
                {retail != null && price != null && retail > price && (
                  <div className="pb-1 text-sm text-muted line-through">{formatMoney(retail)} new</div>
                )}
                {discountPct != null && (
                  <span className="mb-1 rounded-full bg-red-600 px-2.5 py-0.5 text-sm font-bold text-white">
                    −{discountPct}%
                  </span>
                )}
              </div>
              {saveAmount != null && (
                <div className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                  💰 You save {formatMoney(saveAmount)} vs buying new
                </div>
              )}

              {/* FOMO — every figure here is real */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Fomo icon={<Package size={12} />} text="Only 1 available" tone="warn" />
                {nextDrop && (
                  <Fomo
                    icon={<Timer size={12} />}
                    text={`Price drops to ~${formatMoney(nextDrop.price)} in ${nextDrop.days}d — if nobody buys it first`}
                    tone="warn"
                  />
                )}
                {views > 1 && <Fomo icon={<Eye size={12} />} text={`${views} people viewed`} />}
                {saves > 0 && <Fomo icon={<Heart size={12} />} text={`${saves} saved this`} />}
              </div>

              <div className="mt-6">
                <BuyPanel itemId={item.id as string} price={price} isAuthed={Boolean(user)} title={item.title as string} />
              </div>

              {/* Trust — woven into the buying moment, not a footnote */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
                <Trust icon={<ShieldCheck size={14} />} text={`Inspected by ${BRAND.name}`} />
                <Trust icon={<Sparkles size={14} />} text="Cleaned before listing" />
                <Trust icon={<Truck size={14} />} text={`Delivered in ${BRAND.city}, 2–3 days`} />
                <Trust icon={<Lock size={14} />} text="Secure payment" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Condition report */}
          {inspection && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck size={16} className="text-brand" /> Condition report
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex justify-between border-b border-border pb-2">
                  <span>Grade</span>
                  <span className="font-medium text-ink">{conditionLabel ?? "—"}</span>
                </li>
                {inspection.functional_test_passed != null && (
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Functional test</span>
                    <span className="font-medium text-ink">{inspection.functional_test_passed ? "✓ Passed" : "Failed"}</span>
                  </li>
                )}
                {inspection.data_wipe_certified != null && (
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Data wipe</span>
                    <span className="font-medium text-ink">{inspection.data_wipe_certified ? "✓ Certified" : "N/A"}</span>
                  </li>
                )}
                {inspection.notes && (
                  <li className="pt-1">
                    <span className="text-ink">{inspection.notes}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Price timeline — the signature Hoosa feature */}
          {price != null && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Timer size={16} className="text-accent" /> Price timeline
              </h2>
              <p className="mt-1 text-xs text-muted">
                Unsold items drop {dropPct}% on a schedule — wait and it gets cheaper, but someone else might not wait.
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                {retail != null && <TimelineRow label="Retail price, new" value={formatMoney(retail)} muted strike />}
                {history[0] && <TimelineRow label="Listed" value={formatMoney(history[0].price)} muted={history.length > 1} />}
                {history.length > 1 && <TimelineRow label="Today" value={formatMoney(price)} highlight />}
                {history.length <= 1 && <TimelineRow label="Today" value={formatMoney(price)} highlight />}
                {nextDrop && (
                  <TimelineRow
                    label={`${nextDrop.date.toLocaleDateString(BRAND.locale, { day: "numeric", month: "short" })} — if still available`}
                    value={`~${formatMoney(nextDrop.price)}`}
                    future
                  />
                )}
              </ul>
            </div>
          )}
        </div>

        {/* AI summary / description */}
        {item.description ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold">About this item</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.description as string}</p>
          </div>
        ) : null}

        {/* Keep the browsing loop alive */}
        <Carousel title="Similar items" items={similar} />
        <Carousel title="💰 More big savings" items={deals} />
        <Carousel title="🆕 Just arrived" items={fresh} />
      </section>
      </main>
    </div>
  );
}

function Fomo({ icon, text, tone }: { icon: React.ReactNode; text: string; tone?: "warn" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
        tone === "warn"
          ? "bg-accent/10 text-accent"
          : "bg-surface text-muted border border-border"
      }`}
    >
      {icon} {text}
    </span>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-2">
      <span className="text-brand">{icon}</span> {text}
    </span>
  );
}

function TimelineRow({
  label,
  value,
  highlight,
  future,
  muted,
  strike,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  future?: boolean;
  muted?: boolean;
  strike?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
        highlight ? "bg-brand/10 font-semibold text-brand" : future ? "text-accent" : muted ? "text-muted" : ""
      }`}
    >
      <span className="text-xs">{label}</span>
      <span className={`text-sm font-medium ${strike ? "line-through" : ""}`}>{value}</span>
    </li>
  );
}

function Carousel({ title, items }: { title: string; items: CardItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex snap-x gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} className="w-44 shrink-0 snap-start sm:w-52" />
        ))}
      </div>
    </section>
  );
}
