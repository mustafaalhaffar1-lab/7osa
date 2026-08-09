import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { ReportProblem } from "./ReportProblem";

export const metadata = { title: `Purchases - ${BRAND.name}` };
export const dynamic = "force-dynamic";

const ORDER_LABEL: Record<string, string> = {
  paid: "Paid · preparing", fulfilling: "Out for delivery", delivered: "Delivered", completed: "Completed",
};

export default async function PurchasesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: orders }, { data: returns }, { data: policy }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, sale_price, status, created_at, delivered_at, fulfilment, items(title, item_photos(url))")
      .order("created_at", { ascending: false }),
    supabase.from("returns").select("order_id, status"),
    supabase.from("settings").select("value").eq("key", "returns").maybeSingle(),
  ]);

  const windowDays =
    ((policy?.value ?? {}) as { window_days?: number }).window_days ?? 3;
  const returnByOrder = new Map((returns ?? []).map((r) => [r.order_id, r.status]));

  /** Days left to report a problem, or null if the window doesn't apply. */
  function daysLeft(o: { delivered_at: string | null; fulfilment: string }): number | null {
    if (o.fulfilment === "warehouse_pickup" || !o.delivered_at) return null;
    const left = Math.ceil(
      (+new Date(o.delivered_at) + windowDays * 86_400_000 - Date.now()) / 86_400_000
    );
    return left > 0 ? left : null;
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Your purchases</h1>

        {!orders?.length ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center text-muted">
            No purchases yet.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.map((o) => {
              const item = o.items as { title: string; item_photos: { url: string }[] } | null;
              const photo = item?.item_photos?.[0]?.url;
              return (
                <li key={o.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                      {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item?.title ?? "Item"}</div>
                      <div className="text-sm text-muted">
                        {new Date(o.created_at).toLocaleDateString(BRAND.locale)}
                        {o.fulfilment === "warehouse_pickup" ? " · collected in person" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatMoney(o.sale_price)}</div>
                      <div className="text-xs text-muted">{ORDER_LABEL[o.status] ?? o.status}</div>
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
      </main>
    </div>
  );
}
