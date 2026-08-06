"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ScanLine } from "lucide-react";

/** Turn scanned text (a Hoosa QR URL or a raw SKU) into an in-app path. */
function toPath(text: string): string {
  const t = text.trim();
  try {
    const u = new URL(t);
    if (u.pathname.startsWith("/p/") || u.pathname.startsWith("/shop/")) return u.pathname;
  } catch {
    /* not a URL */
  }
  if (/^HSA-\d+$/i.test(t)) return `/p/${t.toUpperCase()}`;
  if (t.startsWith("/p/") || t.startsWith("/shop/")) return t;
  // Anything else: treat it as a search.
  return `/shop?q=${encodeURIComponent(t)}`;
}

export function ScannerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("Starting camera…");

  useEffect(() => {
    let stop: (() => void) | null = null;
    let done = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result) => {
            if (result && !done) {
              done = true;
              controls.stop();
              router.push(toPath(result.getText()));
            }
          }
        );
        stop = () => controls.stop();
        if (!done) setHint("Point the camera at the barcode or QR code");
      } catch (e) {
        const name = (e as { name?: string })?.name;
        setError(
          name === "NotAllowedError" || name === "NotReadableError"
            ? "Camera access was blocked. Allow camera in your browser to scan."
            : "Couldn't start the camera on this device. You can search by name instead."
        );
      }
    })();

    return () => {
      done = true;
      stop?.();
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-4 text-white">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <ScanLine size={17} /> Scan a Hoosa tag
        </span>
        <button onClick={onClose} aria-label="Close scanner" className="rounded-full p-1.5 hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />

        {/* Framing reticle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-52 w-72 rounded-2xl border-2 border-white/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        </div>

        <div className="absolute inset-x-0 bottom-10 px-6 text-center text-sm text-white/90">
          {error ? <span className="text-red-300">{error}</span> : hint}
        </div>
      </div>

      <div className="p-4 text-center">
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
