"use client";

import { useState } from "react";
import { X, Expand } from "lucide-react";

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const current = photos[index];

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl border border-border bg-surface text-muted">
        No photo
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setFull(true)}
        className="group relative block w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-card"
        aria-label="Open fullscreen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={title}
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-bg/85 p-2 text-muted shadow-sm backdrop-blur transition-transform group-hover:scale-110">
          <Expand size={15} />
        </span>
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p}
              onClick={() => setIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                i === index ? "border-brand" : "border-border opacity-70 hover:opacity-100"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {full && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFull(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={title} className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
