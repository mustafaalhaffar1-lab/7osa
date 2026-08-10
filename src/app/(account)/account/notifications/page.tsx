import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";
import { MarkAllRead } from "./MarkAllRead";

export const metadata = { title: `Notifications - ${BRAND.name}` };
export const dynamic = "force-dynamic";

const ICON: Record<string, string> = {
  item_sold: "💰",
  order_placed: "📦",
  payout_released: "🏦",
  payout_paid: "✅",
  payout_failed: "⚠️",
  refund_approved: "↩️",
  return_declined: "📄",
  offer_received: "🤝",
  offer_accepted: "🎉",
  price_approval: "❓",
  item_listed: "🏷️",
  visit_booked: "📅",
  visit_completed: "🚚",
  price_drop: "📉",
};

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/notifications");

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, template, title, body, link, read_at, created_at")
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(100);

  const notes = data ?? [];
  const unread = notes.filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>

      {notes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted">
          Nothing here yet. We&apos;ll let you know when an item sells, an offer arrives, or a payout lands.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {notes.map((n) => {
            const inner = (
              <div className={`flex gap-3 px-5 py-4 ${!n.read_at ? "bg-brand/5" : ""}`}>
                <span className="text-lg leading-none">{ICON[n.template] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-snug">{n.title ?? n.template}</div>
                  {n.body && <p className="mt-0.5 text-sm leading-snug text-muted">{n.body}</p>}
                  <div className="mt-1 text-xs text-muted">
                    {new Date(n.created_at).toLocaleString("en-AE", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block transition-colors hover:bg-bg">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
