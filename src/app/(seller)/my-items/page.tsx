import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import type { ItemStatus } from "@/lib/domain/item-state";

export const metadata = { title: `My items - ${BRAND.name}` };

const STATUS_LABEL: Partial<Record<ItemStatus, string>> = {
  draft: "Draft",
  accepted: "Accepted",
  pickup_scheduled: "Pickup booked",
  collected: "Collected",
  received: "At studio",
  inspected: "Inspected",
  listed: "Live",
  reserved: "Reserved",
  sold: "Sold",
  in_transit: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
};

export default async function MyItemsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, title, status, possession, ai_estimate_min, ai_estimate_max, list_price, item_photos(url)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">My items</h1>
          <Link href="/sell" className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90">
            <Plus size={15} /> Sell another
          </Link>
        </div>

        {!items?.length ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center text-muted">
            Nothing here yet.{" "}
            <Link href="/sell" className="text-brand hover:underline">List your first item</Link>.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((it) => {
              const photo = (it.item_photos as { url: string }[] | null)?.[0]?.url;
              return (
                <li key={it.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.title}</div>
                    <div className="text-sm text-muted">
                      {it.ai_estimate_min != null && it.ai_estimate_max != null
                        ? `Est. ${formatMoney(it.ai_estimate_min)} – ${formatMoney(it.ai_estimate_max)}`
                        : "Estimate pending"}
                      {" · "}
                      {it.possession === "warehouse" ? "We collect" : "Stays home"}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                    {STATUS_LABEL[it.status as ItemStatus] ?? it.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
