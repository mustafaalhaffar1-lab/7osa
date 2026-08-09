import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { ReportProblem } from "@/app/(buyer)/purchases/ReportProblem";

export const dynamic = "force-dynamic";

const ORDER_LABEL: Record<string, { label: string; hint: string }> = {
  pending: { label: "Payment pending", hint: "" },
  paid: { label: "Paid", hint: "We're preparing it" },
  fulfilling: { label: "On its way", hint: "Out for delivery" },
  delivered: { label: "Delivered", hint: "" },
  completed: { label: "Complete", hint: "" },
  refunded: { label: "Refunded", hint: "" },
  cancelled: { label: "Cancelled", hint: "" },
};

export default async function OrdersPage() {
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: orders }, { data: returns }, { data: policy }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, sale_price, status, created_at, delivered_at, fulfilment, items(id, title, item_photos(url))")
      .eq("buyer_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("returns").select("order_id, status"),
    supabase.from("settings").select("value").eq("key", "returns").maybeSingle(),
  ]);

  const windowDays = ((policy?.value ?? {}) as { window_days?: number }).window_days ?? 3;
  const returnByOrder = new Map((returns ?? []).map((r) => [r.order_id, r.status]));

  function daysLeft(o: { delivered_at: string | null; fulfilment: string }): number | null {
    if (o.fulfilment === "warehouse_pickup" || !o.delivered_at) return null;
    const left = Math.ceil((+new Date(o.delivered_at) + windowDays * 86_400_000 - Date.now()) / 86_400_000);
    return left > 0 ? left : null;
  }

  const list = orders ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Your orders</h1>
        <p className="mt-0.5 text-sm text-muted">Everything you&apos;ve bought from {BRAND.name}.</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <ShoppingBag size={26} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted">Everything we sell is inspected, cleaned and guaranteed.</p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg">
            Browse deals
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const item = o.items as { id: string; title: string; item_photos: { url: string }[] } | null;
            const photo = item?.item_photos?.[0]?.url;
            const st = ORDER_LABEL[o.status] ?? { label: o.status, hint: "" };
            return (
              <li key={o.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-bg">
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item?.title ?? "Item"}</div>
                    <div className="text-xs text-muted">
                      {new Date(o.created_at).toLocaleDateString(BRAND.locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {o.fulfilment === "warehouse_pickup" ? " · collected in person" : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand">{st.label}</span>
                      {st.hint && <span className="text-muted">{st.hint}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold">{formatMoney(o.sale_price)}</div>
                  </div>
                </div>
                {(daysLeft(o) != null || returnByOrder.has(o.id)) && (
                  <div className="mt-3 border-t border-border pt-3">
                    <ReportProblem
                      orderId={o.id}
                      daysLeft={daysLeft(o)}
                      existingStatus={returnByOrder.get(o.id) ?? null}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
