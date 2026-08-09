"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addItemPhoto, removeItemPhoto, setShelf } from "../../../admin-actions";

export type ItemPhoto = { id: string; url: string; kind: string };

/** Photography queue + warehouse location, both on the item where ops actually work. */
export function PhotoShelfPanel({
  itemId,
  photos,
  shelfCode,
}: {
  itemId: string;
  photos: ItemPhoto[];
  shelfCode: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shelf, setShelfVal] = useState(shelfCode ?? "");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    for (const file of Array.from(files)) {
      const path = `professional/${itemId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("item-photos").upload(path, file);
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const url = supabase.storage.from("item-photos").getPublicUrl(path).data.publicUrl;
      const res = await addItemPhoto(itemId, url);
      if (res?.error) setError(res.error);
    }
    setUploading(false);
    router.refresh();
  }

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Camera size={15} className="text-brand" /> Photos & location
      </h2>

      {/* Photo grid */}
      <div className="mt-3 flex flex-wrap gap-2">
        {photos.map((p) => (
          <div key={p.id} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => run(() => removeItemPhoto(p.id, itemId))}
              disabled={pending}
              aria-label="Remove photo"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={11} />
            </button>
            {p.kind === "ai_intake" && (
              <span className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center text-[9px] text-white">
                intake
              </span>
            )}
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted transition-colors hover:border-brand hover:text-brand">
          <Camera size={16} />
          <span className="text-[10px]">{uploading ? "…" : "Add"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        First photo is the cover shown on the storefront.
      </p>

      {/* Shelf */}
      <div className="mt-4 border-t border-border pt-4">
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
            <MapPin size={12} /> Warehouse shelf
          </span>
          <div className="flex items-center gap-2">
            <input
              value={shelf}
              onChange={(e) => setShelfVal(e.target.value)}
              placeholder="e.g. A-12-3"
              className="w-32 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button
              disabled={pending || shelf === (shelfCode ?? "")}
              onClick={() => run(() => setShelf(itemId, shelf))}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
