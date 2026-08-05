import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Purchases - ${BRAND.name}` };
export const dynamic = "force-dynamic";

const ORDER_LABEL: Record<string, string> = {
  paid: "Paid · preparing", fulfilling: "Out for delivery", delivered: "Delivered", completed: "Completed",
};

export default async function PurchasesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, sale_price, status, created_at, items(title, item_photos(url))")
    .order("created_at", { ascending: false });

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
                <li key={o.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                    {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item?.title ?? "Item"}</div>
                    <div className="text-sm text-muted">{new Date(o.created_at).toLocaleDateString(BRAND.locale)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatMoney(o.sale_price)}</div>
                    <div className="text-xs text-muted">{ORDER_LABEL[o.status] ?? o.status}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
