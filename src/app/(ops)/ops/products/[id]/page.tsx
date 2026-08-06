import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, User, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { Gallery } from "@/app/(buyer)/shop/[id]/Gallery";
import { ProductActions } from "./ProductActions";
import { PhotoShelfPanel, type ItemPhoto } from "./PhotoShelfPanel";

export const dynamic = "force-dynamic";

const CONDITION_LABEL: Record<string, string> = {
  new: "New", like_new: "Like new", excellent: "Excellent", good: "Good", fair: "Fair",
};
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(BRAND.locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const PRICE_REASON: Record<string, string> = {
  initial: "Listed", markdown: "Auto markdown", manual: "Manual reprice", offer_accepted: "Offer accepted",
};

export default async function OpsProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select(
      "*, categories(name), profiles!items_seller_id_fkey(full_name), item_photos(id, url, sort, kind), price_history(price, reason, created_at)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  const photoRows = ((item.item_photos as (ItemPhoto & { sort: number })[]) ?? []).sort(
    (a, b) => a.sort - b.sort
  );
  const photos = photoRows.map((p) => p.url);
  const history = ((item.price_history as { price: number; reason: string; created_at: string }[]) ?? [])
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const listPrice = item.list_price as number | null;
  const retail = item.retail_price as number | null;
  const startingPrice = history.find((h) => h.reason === "initial")?.price ?? null;
  const discountPct =
    retail != null && listPrice != null && retail > listPrice ? Math.round((1 - listPrice / retail) * 100) : null;
  const sellerName = (item.profiles as { full_name: string | null } | null)?.full_name;
  const categoryName = (item.categories as { name: string } | null)?.name;

  return (
    <div>
      <Link href="/ops/products" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft size={15} /> Products
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Media */}
        <div className="space-y-4">
          <Gallery photos={photos} title={item.title as string} />
          <PhotoShelfPanel
            itemId={item.id as string}
            photos={photoRows.map((p) => ({ id: p.id, url: p.url, kind: p.kind }))}
            shelfCode={(item.shelf_code as string | null) ?? null}
          />
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {item.brand ? <div className="text-sm text-muted">{item.brand as string}</div> : null}
              <h1 className="text-2xl font-semibold tracking-tight">{item.title as string}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-brand/10 px-2 py-0.5 font-mono font-medium text-brand">{item.sku as string}</span>
                <span className="rounded-full border border-border px-2 py-0.5 capitalize">{String(item.status).replace(/_/g, " ")}</span>
                {item.condition_grade && <span>{CONDITION_LABEL[item.condition_grade as string]}</span>}
                {categoryName && <span>· {categoryName}</span>}
                <span>· {item.possession === "warehouse" ? "Warehouse" : "Collect-on-sale"}</span>
              </div>
            </div>
            <Link
              href={`/label/${item.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand"
            >
              <QrCode size={13} /> Print label
            </Link>
          </div>

          {/* Pricing breakdown */}
          <div className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Tag size={15} className="text-brand" /> Pricing
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <PriceItem label="Current price" value={listPrice} strong />
              <PriceItem label="Starting (listed) price" value={startingPrice} />
              <PriceItem
                label="Discount vs new"
                custom={discountPct != null ? `${discountPct}%` : "—"}
                accent={discountPct != null}
              />
              <PriceItem label="Retail (new)" value={retail} strike />
              <PriceItem label="Seller's preferred start" value={item.seller_target_price as number | null} />
              <PriceItem label="Seller's minimum" value={item.seller_min_price as number | null} />
              <PriceItem
                label="AI estimate"
                custom={
                  item.ai_estimate_min != null && item.ai_estimate_max != null
                    ? `${formatMoney(Number(item.ai_estimate_min))} – ${formatMoney(Number(item.ai_estimate_max))}`
                    : "—"
                }
              />
              <PriceItem label="Auto-accept offers above" value={item.auto_accept_above as number | null} />
              <PriceItem label="Markdown floor date" custom={item.sell_by ? fmtDate(item.sell_by as string) : "—"} />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4">
            <ProductActions itemId={item.id as string} status={item.status as string} currentPrice={listPrice} />
          </div>

          {/* Meta / seller */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm shadow-card">
              <h2 className="text-sm font-semibold">Details</h2>
              <dl className="mt-3 space-y-2 text-muted">
                <Meta label="Seller">
                  <Link href={`/ops/customers/${item.seller_id}`} className="inline-flex items-center gap-1 text-brand hover:underline">
                    <User size={12} /> {sellerName || "View profile"}
                  </Link>
                </Meta>
                <Meta label="Model">{(item.model as string) || "—"}</Meta>
                <Meta label="Weight">{item.weight_kg != null ? `${item.weight_kg} kg` : "—"}</Meta>
                <Meta label="Longest side">{item.longest_side_cm != null ? `${item.longest_side_cm} cm` : "—"}</Meta>
                <Meta label="Added">{fmtDate(item.created_at as string)}</Meta>
                <Meta label="Listed">{fmtDate(item.listed_at as string)}</Meta>
              </dl>
            </div>

            {/* Price history */}
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm shadow-card">
              <h2 className="text-sm font-semibold">Price history</h2>
              {history.length === 0 ? (
                <p className="mt-3 text-muted">No price changes yet.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {history
                    .slice()
                    .reverse()
                    .map((h, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="text-xs text-muted">
                          {PRICE_REASON[h.reason] ?? h.reason} · {fmtDate(h.created_at)}
                        </span>
                        <span className="font-semibold">{formatMoney(Number(h.price))}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description ? (
            <div className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="text-sm font-semibold">Description</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description as string}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PriceItem({
  label,
  value,
  custom,
  strong,
  strike,
  accent,
}: {
  label: string;
  value?: number | null;
  custom?: string;
  strong?: boolean;
  strike?: boolean;
  accent?: boolean;
}) {
  const display = custom ?? (value != null ? formatMoney(Number(value)) : "—");
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`mt-0.5 ${strong ? "text-lg font-bold" : "font-medium"} ${strike ? "text-muted line-through" : ""} ${accent ? "text-brand" : ""}`}
      >
        {display}
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
