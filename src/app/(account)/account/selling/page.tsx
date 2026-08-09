import Link from "next/link";
import { Plus, CalendarCheck, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import type { ItemStatus } from "@/lib/domain/item-state";
import { ItemControls } from "@/app/(seller)/my-items/ItemControls";

export const dynamic = "force-dynamic";

/** Plain-English status for a seller — never show them raw enum values. */
const STATUS: Partial<Record<ItemStatus, { label: string; hint: string; tone: "live" | "work" | "done" | "off" }>> = {
  draft: { label: "Draft", hint: "Not submitted yet", tone: "off" },
  estimated: { label: "Quoted", hint: "Waiting for you to accept", tone: "off" },
  accepted: { label: "Accepted", hint: "We're arranging the next step", tone: "work" },
  pickup_scheduled: { label: "Pickup booked", hint: "We're coming to collect it", tone: "work" },
  collected: { label: "Collected", hint: "It's with us", tone: "work" },
  received: { label: "At our studio", hint: "Waiting to be checked", tone: "work" },
  inspected: { label: "Checked", hint: "Being photographed and priced", tone: "work" },
  listed: { label: "On sale", hint: "Live on the shop", tone: "live" },
  reserved: { label: "Reserved", hint: "A buyer is checking out", tone: "live" },
  sold: { label: "Sold", hint: "Payment clearing", tone: "done" },
  collection_scheduled: { label: "Sold", hint: "We're collecting it from you", tone: "done" },
  in_transit: { label: "Sold", hint: "On its way to the buyer", tone: "done" },
  delivered: { label: "Delivered", hint: "Your money clears shortly", tone: "done" },
  completed: { label: "Complete", hint: "Paid in full", tone: "done" },
  returned: { label: "Returned", hint: "Came back to us", tone: "off" },
  unsold_expired: { label: "Unsold", hint: "Needs a decision", tone: "off" },
  withdrawn: { label: "Withdrawn", hint: "No longer for sale", tone: "off" },
  declined: { label: "Not accepted", hint: "Outside what we take", tone: "off" },
};

const TONE = {
  live: "bg-brand/10 text-brand",
  work: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  done: "bg-green-500/10 text-green-600 dark:text-green-400",
  off: "bg-bg text-muted",
};

const SOLD_STATES = new Set(["sold", "collection_scheduled", "in_transit", "delivered", "completed"]);
const LIVE_STATES = new Set(["listed", "reserved"]);

/** Say the right thing about the price for the state the item is actually in. */
function priceLine(it: {
  status: string;
  list_price: number | null;
  ai_estimate_min: number | null;
  ai_estimate_max: number | null;
}): string {
  const price = it.list_price != null ? formatMoney(Number(it.list_price)) : null;
  if (price && SOLD_STATES.has(it.status)) return `Sold for ${price}`;
  if (price && LIVE_STATES.has(it.status)) return `On sale at ${price}`;
  if (price) return `Priced at ${price}`;
  if (it.ai_estimate_min != null && it.ai_estimate_max != null) {
    return `Estimated ${formatMoney(Number(it.ai_estimate_min))} – ${formatMoney(Number(it.ai_estimate_max))}`;
  }
  return "Estimate pending";
}

export default async function SellingPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select(
      "id, title, brand, status, possession, list_price, ai_estimate_min, ai_estimate_max, seller_min_price, auto_accept_above, end_of_life_pref, company_owned, sell_by, item_photos(url), item_metrics(views, saves)"
    )
    .order("created_at", { ascending: false });

  const list = items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Selling</h1>
          <p className="mt-0.5 text-sm text-muted">
            {list.length === 0 ? "Nothing listed yet." : `${list.length} item${list.length === 1 ? "" : "s"} with us.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/account/visits"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
          >
            <CalendarCheck size={15} /> Book a visit
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90"
          >
            <Plus size={15} /> Sell an item
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <PackageOpen size={26} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="font-medium">Turn something you don&apos;t use into money</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Upload a photo and we&apos;ll price it — or book a visit and we&apos;ll come and do all of it for you.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/sell" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg">
              Sell an item
            </Link>
            <Link href="/account/visits" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium">
              Book a visit
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((it) => {
            const photo = (it.item_photos as { url: string }[] | null)?.[0]?.url;
            const m = it.item_metrics as { views: number; saves: number } | { views: number; saves: number }[] | null;
            const metrics = Array.isArray(m) ? m[0] : m;
            const s = STATUS[it.status as ItemStatus];
            const drops = it.sell_by
              ? Math.ceil((+new Date(it.sell_by as string) - Date.now()) / 86_400_000)
              : null;

            return (
              <li key={it.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start gap-3 sm:items-center">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-bg">
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {it.brand ? `${it.brand} · ` : ""}
                      {it.title}
                    </div>
                    <div className="mt-0.5 text-sm text-muted">{priceLine(it)}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      {s && (
                        <span className={`rounded-full px-2 py-0.5 font-medium ${TONE[s.tone]}`}>{s.label}</span>
                      )}
                      {s && <span className="text-muted">{s.hint}</span>}
                    </div>
                    {(metrics?.views || metrics?.saves || drops) && it.status === "listed" && (
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted">
                        {metrics?.views ? <span>{metrics.views} views</span> : null}
                        {metrics?.saves ? <span>{metrics.saves} saved it</span> : null}
                        {drops && drops > 0 ? <span>Price drops in {drops}d</span> : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <ItemControls
                    itemId={it.id}
                    status={it.status as string}
                    minPrice={it.seller_min_price != null ? Number(it.seller_min_price) : null}
                    autoAccept={it.auto_accept_above != null ? Number(it.auto_accept_above) : null}
                    pref={(it.end_of_life_pref as string) ?? "keep"}
                    companyOwned={Boolean(it.company_owned)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
