"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown } from "lucide-react";
import { runMarkdowns } from "./admin-actions";

/**
 * Runs the markdown clock on demand. The same RPC (apply_markdowns) can be called on a
 * schedule by a cron job — this button exists so ops can force it and see the result.
 */
export function MarkdownRunner({ due }: { due: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function go() {
    setMsg(null);
    start(async () => {
      const res = await runMarkdowns();
      if (res.error) setMsg(res.error);
      else {
        setMsg(
          res.applied === 0
            ? "Nothing was due — all prices are current."
            : `${res.applied} item${res.applied === 1 ? "" : "s"} repriced.`
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2.5 text-sm">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
          <TrendingDown size={15} />
        </span>
        <div>
          <div className="font-medium">Markdown clock</div>
          <div className="text-xs text-muted">
            {due > 0
              ? `${due} listed item${due === 1 ? " is" : "s are"} due for a price drop.`
              : "No items due right now."}
            {msg ? ` ${msg}` : ""}
          </div>
        </div>
      </div>
      <button
        onClick={go}
        disabled={pending}
        className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Running…" : "Run markdowns now"}
      </button>
    </div>
  );
}
