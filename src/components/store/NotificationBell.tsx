"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  template: string;
  title: string | null;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Emoji reads faster than an icon set at this size, and survives any theme. */
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

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, template, title, body, link, read_at, created_at")
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(12);
    setNotes((data as Note[]) ?? []);
  }

  useEffect(() => {
    load();
    // Cheap freshness without a socket: re-check when the tab regains focus.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const unread = notes.filter((n) => !n.read_at).length;

  async function markAllRead() {
    const supabase = createClient();
    await supabase.rpc("mark_notifications_read", { p_ids: null });
    setNotes((p) => p.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-ink"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {notes.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {notes.map((n) => {
                const inner = (
                  <div className={`flex gap-2.5 px-4 py-3 ${!n.read_at ? "bg-brand/5" : ""}`}>
                    <span className="text-base leading-none">{ICON[n.template] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">{n.title ?? n.template}</div>
                      {n.body && <p className="mt-0.5 text-xs leading-snug text-muted">{n.body}</p>}
                      <div className="mt-1 text-[10px] text-muted">{ago(n.created_at)}</div>
                    </div>
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)} className="block transition-colors hover:bg-bg">
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
      )}
    </div>
  );
}
